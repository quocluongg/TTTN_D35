"""
Hybrid Retriever: Kết hợp Dense Search (ChromaDB) và Sparse Search (BM25) sử dụng Reciprocal Rank Fusion (RRF).
Hỗ trợ tìm kiếm song song và truy vấn so sánh nhiều sản phẩm.
"""
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Any

from indexing import vector_store, bm25_index
from embedding.bge_m3_encoder import encode_query
from retrieval.query_builder import RetrievalQuery
from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class RetrievedDocument:
    id: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    score: float = 0.0
    source: str = "hybrid"


def rrf_fusion(
    dense_hits: List[Dict[str, Any]],
    bm25_hits: List[Dict[str, Any]],
    k: int = 60,
    top_k: int = 20,
) -> List[RetrievedDocument]:
    """
    IPO Model:
    - Input:
        - dense_hits: Danh sách kết quả từ Dense Search (ChromaDB)
        - bm25_hits: Danh sách kết quả từ Sparse Search (BM25)
        - k: Hằng số RRF (mặc định 60)
        - top_k: Số lượng tài liệu tối đa trả về
    - Process:
        Step 1: Khởi tạo bảng điểm RRF và doc_map lưu trữ thông tin tài liệu
        Step 2: Tính điểm RRF cho các tài liệu từ Dense Search: 1 / (k + rank_dense + 1)
        Step 3: Cộng dồn điểm RRF cho các tài liệu từ BM25 Search: 1 / (k + rank_bm25 + 1)
        Step 4: Sắp xếp giảm dần danh sách doc_id theo tổng điểm RRF
        Step 5: Đóng gói top_k tài liệu vào danh sách RetrievedDocument
    - Output: List[RetrievedDocument] sắp xếp theo thứ tự ưu tiên RRF giảm dần
    """
    # Step 1: Khởi tạo biến lưu trữ điểm số RRF và bản đồ tài liệu
    scores: Dict[str, float] = {}
    doc_map: Dict[str, Dict[str, Any]] = {}

    # Step 2: Tính điểm RRF cho kết quả từ Dense Search
    for rank, hit in enumerate(dense_hits):
        doc_id = hit["id"]
        doc_map[doc_id] = hit
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))

    # Step 3: Cộng dồn điểm RRF cho kết quả từ BM25 Search
    for rank, hit in enumerate(bm25_hits):
        doc_id = hit["id"]
        if doc_id not in doc_map:
            doc_map[doc_id] = hit
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))

    # Step 4: Sắp xếp danh sách tài liệu theo tổng điểm RRF giảm dần
    sorted_doc_ids = sorted(scores.keys(), key=lambda doc_id: scores[doc_id], reverse=True)

    # Step 5: Trích xuất top_k tài liệu cao điểm nhất
    results: List[RetrievedDocument] = []
    for doc_id in sorted_doc_ids[:top_k]:
        hit = doc_map[doc_id]
        results.append(
            RetrievedDocument(
                id=doc_id,
                text=hit["text"],
                metadata=hit.get("metadata", {}),
                score=scores[doc_id],
                source="rrf_fusion",
            )
        )

    return results


def retrieve(retrieval_query: RetrievalQuery, top_k: int | None = None) -> List[RetrievedDocument]:
    """
    IPO Model:
    - Input:
        - retrieval_query: Cấu trúc truy vấn RetrievalQuery (search_text, filters, preferred_chunk_types)
        - top_k: Số lượng tài liệu tối đa trả về (tùy chọn)
    - Process:
        Step 1: Sinh dense vector embedding từ BGE-M3 cho search_text
        Step 2: Thực hiện Dense Vector Search trong ChromaDB
        Step 3: Thực hiện Sparse Lexical Search trong BM25 Index
        Step 4: Dung hợp 2 kết quả tìm kiếm bằng thuật toán RRF Fusion
        Step 5: Áp dụng Score Boosting tăng trọng số nhẹ cho các preferred_chunk_types nếu có
    - Output: List[RetrievedDocument] danh sách tài liệu tìm kiếm kết hợp
    """
    # Step 1: Lấy thông số top_k và search_text
    top_k = top_k or settings.RETRIEVAL_TOP_K
    search_text = retrieval_query.search_text

    # Step 2: Sinh embedding vector cho truy vấn bằng BGE-M3
    query_emb = encode_query(search_text)
    query_emb_list = query_emb.tolist() if hasattr(query_emb, "tolist") else list(query_emb)

    # Step 3: Tìm kiếm Dense Search từ ChromaDB Vector Store
    try:
        dense_hits = vector_store.search(
            query_embedding=query_emb_list,
            top_k=top_k,
            where=retrieval_query.filters if retrieval_query.filters else None,
        )
    except Exception as e:
        logger.warning(f"Lỗi Dense Search ChromaDB: {e}")
        dense_hits = []

    # Step 4: Tìm kiếm Sparse Search từ BM25 Index
    try:
        bm25_hits = bm25_index.search(
            query=search_text,
            top_k=top_k,
            filters=retrieval_query.filters if retrieval_query.filters else None,
        )
    except Exception as e:
        logger.warning(f"Lỗi Sparse Search BM25: {e}")
        bm25_hits = []

    # Step 5: Hợp nhất kết quả Dense + BM25 bằng thuật toán RRF
    fused_results = rrf_fusion(dense_hits, bm25_hits, k=settings.RRF_K, top_k=top_k)

    # Step 6: Tăng điểm nhẹ (Score Boosting x1.15) cho các loại chunk ưu tiên nếu được cấu hình
    if retrieval_query.preferred_chunk_types and fused_results:
        def _boost_score(doc: RetrievedDocument) -> float:
            chunk_type = doc.metadata.get("chunk_type")
            boost = 1.15 if chunk_type in retrieval_query.preferred_chunk_types else 1.0
            return doc.score * boost

        fused_results.sort(key=_boost_score, reverse=True)

    # Step 7: Ghi log hoàn thành và trả về danh sách tài liệu
    logger.info(f"Hybrid retrieval finished for query='{search_text}', returned {len(fused_results)} docs")
    return fused_results

