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
    global _client_instance, _collection_instance
    if _collection_instance is None:
        _client_instance = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        _collection_instance = _client_instance.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection_instance


def upsert_chunks(chunks: list[Chunk]) -> None:
    """Ghi (hoặc ghi đè nếu trùng id) các chunk đã có embedding vào Chroma."""
    if not chunks:
        return

    collection = _get_collection()
    collection.upsert(
        ids=[c.id for c in chunks],
        embeddings=[c.embedding.tolist() for c in chunks],
        documents=[c.text for c in chunks],
        metadatas=[c.metadata_dict() for c in chunks],
    )
    logger.info(f"Đã upsert {len(chunks)} chunks vào Chroma")


def delete_by_product_id(product_id: str) -> None:
    """Xóa toàn bộ chunk của 1 sản phẩm - dùng khi update (xóa cũ trước khi tạo mới) hoặc delete."""
    collection = _get_collection()
    collection.delete(where={"product_id": product_id})
    logger.info(f"Đã xóa chunks của product_id={product_id} khỏi Chroma")


def search(
    query_embedding: list[float],
    top_k: int = 20,
    where: dict | None = None,
) -> list[dict]:
    """Dense search - dùng ở phần retrieval (chat), để sẵn cho module sau."""
    collection = _get_collection()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where,
    )

    hits = []
    for i in range(len(results["ids"][0])):
        hits.append({
            "id": results["ids"][0][i],
            "text": results["documents"][0][i],
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })
    return hits
