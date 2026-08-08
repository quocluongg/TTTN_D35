"""
Task lõi của toàn bộ ingestion pipeline.
Được enqueue từ ProductService mỗi khi có insert/update/delete vào bảng products.

Luồng xử lý:
  - delete: xóa chunk khỏi vector DB + BM25, xong.
  - create/update: xóa chunk cũ (nếu có) -> fetch product mới nhất từ DB
                    -> normalize -> chunk -> embed -> index -> set status=active
"""
import asyncio
import logging
import uuid

# pyrefly: ignore [missing-import]
from celery import Task

# pyrefly: ignore [missing-import]
from workers.celery_app import celery_app
# pyrefly: ignore [missing-import]
from db.database import db_session_ctx
# pyrefly: ignore [missing-import]
from db.product_repository import ProductRepository
# pyrefly: ignore [missing-import]
from data_pipeline.cleaning.normalizer import normalize_product
# pyrefly: ignore [missing-import]
from data_pipeline.chunking.chunk_orchestrator import chunk_product
# pyrefly: ignore [missing-import]
from embedding.batch_embedder import embed_chunks
# pyrefly: ignore [missing-import]
from indexing.hybrid_indexer import index_chunks, remove_product_chunks
# pyrefly: ignore [missing-import]
from config.constants import SyncAction, ProductStatus


logger = logging.getLogger(__name__)


def _product_to_dict(product) -> dict:
    """Chuyển ORM object Product -> plain dict để các module chunking/normalize xử lý."""
    return {
        "id": str(product.id),
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "price": product.price,
        "specs": product.specs or {},
        "description": product.description or "",
        "promotions": product.promotions or "",
        "warranty": product.warranty or "",
        "faqs": [{"question": f.question, "answer": f.answer} for f in product.faqs],
    }


async def _sync_product_index_async(product_id: str, action: str) -> dict:
    pid = uuid.UUID(product_id)

    async with db_session_ctx() as session:
        repo = ProductRepository(session)

        if action == SyncAction.DELETE:
            remove_product_chunks(product_id)
            logger.info(f"[DELETE] Đã xóa index cho product_id={product_id}")
            return {"product_id": product_id, "action": action, "status": "done"}

        # action == create / update
        product = await repo.get_by_id(pid)
        if product is None:
            logger.warning(f"Product {product_id} không tồn tại trong DB, bỏ qua sync")
            return {"product_id": product_id, "action": action, "status": "skipped_not_found"}

        try:
            # Luôn xóa chunk cũ trước - đảm bảo không còn data cũ (giá cũ, spec cũ) lẫn trong index
            remove_product_chunks(product_id)

            raw_dict = _product_to_dict(product)
            normalized = normalize_product(raw_dict)

            chunks = chunk_product(normalized)
            chunks = embed_chunks(chunks)
            index_chunks(chunks)

            await repo.set_status(pid, ProductStatus.ACTIVE)
            logger.info(
                f"[{action.upper()}] Đã index xong product_id={product_id} "
                f"({len(chunks)} chunks)"
            )
            return {
                "product_id": product_id,
                "action": action,
                "status": "done",
                "chunks_count": len(chunks),
            }

        except Exception:
            await repo.set_status(pid, ProductStatus.FAILED)
            logger.exception(f"Lỗi khi index product_id={product_id}")
            raise


@celery_app.task(
    bind=True,
    name="sync_product_index",
    max_retries=3,
    default_retry_delay=15,
)
def sync_product_index(self: Task, product_id: str, action: str) -> dict:
    """
    Entry point Celery task (sync wrapper, vì Celery task mặc định chạy sync).
    Bọc toàn bộ logic async bên trong bằng asyncio.run().
    """
    try:
        return asyncio.run(_sync_product_index_async(product_id, action))
    except Exception as exc:
        logger.warning(f"Retry sync_product_index cho {product_id}, lỗi: {exc}")
        raise self.retry(exc=exc)
