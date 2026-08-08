"""
Ingestion Service: Orchestrates the product ingestion pipeline.
Fetch -> Chunk -> Embed -> Index
"""
import logging
import time

from db.product_repository import ProductRepository
from data_pipeline.chunking.chunk_orchestrator import chunk_product
from embedding import bge_m3_encoder
from indexing import hybrid_indexer
from services.task_manager import TaskManager, TaskStatus

logger = logging.getLogger(__name__)


class IngestionService:
    def __init__(
        self,
        repo: ProductRepository,
        task_manager: TaskManager,
        encoder=None,
        indexer=None,
    ):
        self.repo = repo
        self.task_manager = task_manager
        self.encoder = encoder or bge_m3_encoder
        self.indexer = indexer or hybrid_indexer

    async def ingest_product(self, product_id: str, task_id: str) -> None:
        """
        Run the full ingestion pipeline for a single product.

        Args:
            product_id: UUID of the product to ingest
            task_id: Task ID for tracking progress
        """
        start_time = time.time()

        try:
            self.task_manager.update_task(task_id, status=TaskStatus.PROCESSING)

            product = await self.repo.get_product_by_id(product_id)
            if product is None:
                raise ValueError(f"Product {product_id} not found")

            chunks = chunk_product(product)
            if not chunks:
                raise ValueError(f"No chunks generated for product {product_id}")

            texts = [c.text for c in chunks]
            embeddings = self.encoder.encode_texts(texts)

            for chunk, embedding in zip(chunks, embeddings):
                chunk.embedding = embedding

            self.indexer.remove_product_chunks(product_id)
            self.indexer.index_chunks(chunks)

            duration_ms = int((time.time() - start_time) * 1000)

            self.task_manager.update_task(
                task_id,
                status=TaskStatus.COMPLETED,
                chunks_created=len(chunks),
                duration_ms=duration_ms,
            )

            logger.info(
                f"Ingestion completed for product {product_id}: "
                f"{len(chunks)} chunks in {duration_ms}ms"
            )

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"Ingestion failed for product {product_id}: {e}")

            self.task_manager.update_task(
                task_id,
                status=TaskStatus.FAILED,
                error=str(e),
                duration_ms=duration_ms,
            )
