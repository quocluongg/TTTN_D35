"""
Hybrid Retriever: Kết hợp Dense Search (ChromaDB) và Sparse Search (BM25) sử dụng Reciprocal Rank Fusion (RRF).
Hỗ trợ tìm kiếm song song và truy vấn so sánh nhiều sản phẩm.
"""
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Any

# pyrefly: ignore [missing-import]
from indexing import vector_store, bm25_index
# pyrefly: ignore [missing-import]
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
    Hợp nhất danh sách kết quả Dense và BM25 bằng thuật toán Reciprocal Rank Fusion (RRF).
    Công thức: RRF_score(d) = 1 / (k + rank_dense(d)) + 1 / (k + rank_bm25(d))
    """
    scores: Dict[str, float] = {}
    doc_map: Dict[str, Dict[str, Any]] = {}

    # Xử lý kết quả Dense Search
    for rank, hit in enumerate(dense_hits):
        doc_id = hit["id"]
        doc_map[doc_id] = hit
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))

    # Xử lý kết quả BM25 Search
    for rank, hit in enumerate(bm25_hits):
        doc_id = hit["id"]
        if doc_id not in doc_map:
            doc_map[doc_id] = hit
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))

    # Sắp xếp các tài liệu theo điểm RRF giảm dần
    sorted_doc_ids = sorted(scores.keys(), key=lambda doc_id: scores[doc_id], reverse=True)

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
    Thực hiện Hybrid Retrieval: Dense + BM25 Search + RRF Fusion.
    """
    top_k = top_k or settings.RETRIEVAL_TOP_K
    search_text = retrieval_query.search_text

    # 1. Sinh dense query embedding
    query_emb = encode_query(search_text)
    query_emb_list = query_emb.tolist() if hasattr(query_emb, "tolist") else list(query_emb)

    # 2. Dense Search từ ChromaDB
    try:
        dense_hits = vector_store.search(
            query_embedding=query_emb_list,
            top_k=top_k,
            where=retrieval_query.filters if retrieval_query.filters else None,
        )
    except Exception as e:
        logger.warning(f"Lỗi Dense Search ChromaDB: {e}")
        dense_hits = []

    # 3. Sparse Search từ BM25
    try:
        bm25_hits = bm25_index.search(
            query=search_text,
            top_k=top_k,
            filters=retrieval_query.filters if retrieval_query.filters else None,
        )
    except Exception as e:
        logger.warning(f"Lỗi Sparse Search BM25: {e}")
        bm25_hits = []

    # 4. Hợp nhất bằng RRF
    fused_results = rrf_fusion(dense_hits, bm25_hits, k=settings.RRF_K, top_k=top_k)

    # 5. Nếu có ưu tiên preferred_chunk_types, sắp xếp tăng nhẹ trọng số cho preferred chunk types
    if retrieval_query.preferred_chunk_types and fused_results:
        def _boost_score(doc: RetrievedDocument) -> float:
            chunk_type = doc.metadata.get("chunk_type")
            boost = 1.15 if chunk_type in retrieval_query.preferred_chunk_types else 1.0
            return doc.score * boost

        fused_results.sort(key=_boost_score, reverse=True)

    logger.info(f"Hybrid retrieval finished for query='{search_text}', returned {len(fused_results)} docs")
    return fused_results
