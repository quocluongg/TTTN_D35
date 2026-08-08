"""
Admin Stats Router: Endpoints for monitoring RAG system.
"""
from fastapi import APIRouter

from indexing import vector_store, bm25_index
from services.task_manager import get_task_manager, TaskStatus

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_stats():
    """
    Get RAG system statistics.
    """
    task_manager = get_task_manager()

    # Get ChromaDB stats
    try:
        collection = vector_store._get_collection()
        total_chunks = collection.count()
    except Exception:
        total_chunks = 0

    # Get BM25 stats
    try:
        bm25_index._ensure_loaded()
        bm25_count = len(bm25_index._corpus)
    except Exception:
        bm25_count = 0

    # Count pending tasks
    pending_tasks = sum(
        1 for task in task_manager._tasks.values()
        if task["status"] in (TaskStatus.PENDING, TaskStatus.PROCESSING)
    )

    return {
        "total_chunks_chromadb": total_chunks,
        "total_chunks_bm25": bm25_count,
        "pending_tasks": pending_tasks,
    }


@router.post("/reindex")
async def reindex_all():
    """
    Trigger full reindex of all products.
    This is a long-running operation.
    """
    # TODO: Implement full reindex logic
    return {
        "status": "started",
        "message": "Full reindex initiated",
    }
