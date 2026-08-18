"""Chat and sync logging endpoints."""
import time
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/admin/logs", tags=["admin-logs"])

# In-memory log stores (last 1000 entries each)
_chat_logs: list[dict] = []
_sync_logs: list[dict] = []
_start_time = time.time()


def log_chat(
    query: str,
    intent: str,
    confidence: float,
    response: str,
    sources: list,
    latency_ms: int,
):
    """Log a chat interaction."""
    _chat_logs.append({
        "timestamp": datetime.now().isoformat(),
        "query": query,
        "intent": intent,
        "confidence": confidence,
        "response_preview": response[:200],
        "sources_count": len(sources),
        "latency_ms": latency_ms,
    })
    if len(_chat_logs) > 1000:
        _chat_logs.pop(0)


def log_sync(
    product_id: str,
    product_name: str,
    action: str,
    chunks: int,
    status: str,
    duration_ms: int,
):
    """Log a sync operation."""
    _sync_logs.append({
        "timestamp": datetime.now().isoformat(),
        "product_id": product_id,
        "product_name": product_name,
        "action": action,
        "chunks_created": chunks,
        "status": status,
        "duration_ms": duration_ms,
    })
    if len(_sync_logs) > 1000:
        _sync_logs.pop(0)


def get_start_time() -> float:
    return _start_time


def get_chat_logs_raw() -> list[dict]:
    return _chat_logs


def get_sync_logs_raw() -> list[dict]:
    return _sync_logs


# ============ ENDPOINTS ============


@router.get("/chat")
@router.get("/rag/chat")
async def get_chat_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    intent: Optional[str] = None,
):
    """Get chat history logs."""
    logs = _chat_logs.copy()
    if intent:
        logs = [l for l in logs if l.get("intent") == intent]
    logs.reverse()

    total = len(logs)
    start = (page - 1) * page_size
    end = start + page_size

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "logs": logs[start:end],
    }


@router.get("/sync")
@router.get("/rag/sync")
async def get_sync_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """Get sync history logs."""
    logs = _sync_logs.copy()
    logs.reverse()

    total = len(logs)
    start = (page - 1) * page_size
    end = start + page_size

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "logs": logs[start:end],
    }
