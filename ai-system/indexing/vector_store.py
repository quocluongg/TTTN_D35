"""
Wrapper cho ChromaDB - lưu dense embedding + metadata để retrieve và filter.
Dùng PersistentClient để dữ liệu không mất khi restart service.
"""
import logging

import chromadb
from chromadb.config import Settings as ChromaSettings

from config.settings import get_settings
from data_pipeline.chunking.chunk_schema import Chunk

logger = logging.getLogger(__name__)
settings = get_settings()

_client_instance = None
_collection_instance = None


def _get_collection():
    """
    IPO Model:
    - Input: None
    - Process: Khởi tạo ChromaDB PersistentClient và lấy hoặc tạo collection 'products'
    - Output: Chroma Collection instance
    """
    # Step 1: Kiểm tra biến toàn cục
    global _client_instance, _collection_instance
    if _collection_instance is None:
        # Step 2: Tạo PersistentClient với đường dẫn cấu hình
        _client_instance = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        # Step 3: Lấy hoặc tạo collection với không gian khoảng cách cosine
        _collection_instance = _client_instance.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    # Step 4: Trả về collection instance
    return _collection_instance


def upsert_chunks(chunks: list[Chunk]) -> None:
    """
    IPO Model:
    - Input: chunks (Danh sách các đối tượng Chunk đã có embedding vector)
    - Process:
        Step 1: Kiểm tra danh sách chunks rỗng -> return
        Step 2: Lấy Chroma Collection instance
        Step 3: Trích xuất ids, embeddings, documents, metadatas từ danh sách chunks
        Step 4: Gọi collection.upsert để lưu dữ liệu bền vững
    - Output: None
    """
    # Step 1: Kiểm tra danh sách rỗng
    if not chunks:
        return

    # Step 2: Lấy collection ChromaDB
    collection = _get_collection()

    # Step 3: Thực hiện upsert dữ liệu vector và metadata
    collection.upsert(
        ids=[c.id for c in chunks],
        embeddings=[c.embedding.tolist() for c in chunks],
        documents=[c.text for c in chunks],
        metadatas=[c.metadata_dict() for c in chunks],
    )

    # Step 4: Ghi log hoàn thành
    logger.info(f"Đã upsert {len(chunks)} chunks vào Chroma")


def delete_by_product_id(product_id: str) -> None:
    """
    IPO Model:
    - Input: product_id (Mã định danh sản phẩm dạng chuỗi)
    - Process:
        Step 1: Lấy Chroma Collection instance
        Step 2: Xóa các chunk có bộ lọc where={"product_id": product_id}
    - Output: None
    """
    # Step 1: Lấy collection ChromaDB
    collection = _get_collection()

    # Step 2: Xóa tài liệu theo product_id
    collection.delete(where={"product_id": product_id})

    # Step 3: Ghi vết log
    logger.info(f"Đã xóa chunks của product_id={product_id} khỏi Chroma")


def search(
    query_embedding: list[float],
    top_k: int = 20,
    where: dict | None = None,
) -> list[dict]:
    """
    IPO Model:
    - Input:
        - query_embedding: Vector embedding của câu truy vấn (dạng list float)
        - top_k: Số lượng kết quả gần nhất trả về (mặc định 20)
        - where: Bộ lọc metadata tùy chọn (dạng dict)
    - Process:
        Step 1: Lấy Chroma Collection instance
        Step 2: Gọi collection.query thực hiện tìm kiếm hàng xóm gần nhất (KNN cosine distance)
        Step 3: Định dạng lại kết quả tìm kiếm gồm id, text, metadata, distance
    - Output: List[dict] danh sách các đoạn văn bản khớp gần nhất
    """
    # Step 1: Lấy collection
    collection = _get_collection()

    # Step 2: Thực hiện truy vấn Vector Search
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where,
    )

    # Step 3: Trích xuất và định dạng kết quả hits
    hits = []
    for i in range(len(results["ids"][0])):
        hits.append({
            "id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })

    # Step 4: Trả về kết quả hits
    return hits

