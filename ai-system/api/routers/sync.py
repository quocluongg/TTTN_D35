"""
Sync API Router: Endpoints for Java backend to trigger product sync.
"""
import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException

from api.middleware import verify_api_key
from services.task_manager import get_task_manager, TaskStatus
from services.ingestion_service import IngestionService
from db.product_repository import ProductRepository
from db.database import AsyncSessionLocal
from indexing import hybrid_indexer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/product/{product_id}", status_code=202)
async def sync_product(
    product_id: str,
    api_key: str = Depends(verify_api_key),
):
    """
    Trigger product ingestion (async).

    Returns 202 Accepted immediately while processing in background.
    """
    task_manager = get_task_manager()
    task_id = task_manager.create_task(product_id=product_id)

    asyncio.create_task(_run_ingestion(product_id, task_id))

    return {
        "status": "accepted",
        "task_id": task_id,
        "message": "Product ingestion started",
    }


@router.delete("/product/{product_id}")
async def delete_product(
    product_id: str,
    api_key: str = Depends(verify_api_key),
):
    """
    Delete product from all indexes (ChromaDB + BM25).
    """
    try:
        hybrid_indexer.remove_product_chunks(product_id)

        return {
            "status": "deleted",
            "message": "Product removed from index",
        }
    except Exception as e:
        logger.error(f"Failed to delete product {product_id} from index: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Get ingestion task status.
    """
    task_manager = get_task_manager()
    task = task_manager.get_task(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


async def _run_ingestion(product_id: str, task_id: str):
    """Run ingestion in background."""
    try:
        async with AsyncSessionLocal() as session:
            repo = ProductRepository(session)
            ingestion_service = IngestionService(
                repo=repo,
                task_manager=get_task_manager(),
            )
            await ingestion_service.ingest_product(product_id, task_id)
    except Exception as e:
        logger.error(f"Background ingestion failed: {e}")
        get_task_manager().update_task(
            task_id,
            status=TaskStatus.FAILED,
            error=str(e),
        )
