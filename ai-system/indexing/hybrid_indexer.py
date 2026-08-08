"""
Entry point duy nhất mà worker cần gọi để ghi/xóa chunk - đảm bảo vector store
và BM25 index luôn đồng bộ với nhau (không bao giờ chỉ update 1 trong 2).
"""
import logging

from data_pipeline.chunking.chunk_schema import Chunk
from indexing import vector_store, bm25_index

logger = logging.getLogger(__name__)


def index_chunks(chunks: list[Chunk]) -> None:
    """Ghi chunks vào cả vector DB (dense) và BM25 (sparse)."""
    vector_store.upsert_chunks(chunks)
    bm25_index.add_documents(chunks)


def remove_product_chunks(product_id: str) -> None:
    """Xóa toàn bộ chunk của 1 sản phẩm khỏi cả 2 index - dùng khi update hoặc delete."""
    vector_store.delete_by_product_id(product_id)
    bm25_index.delete_by_product_id(product_id)
    logger.info(f"Đã xóa toàn bộ index của product_id={product_id}")
