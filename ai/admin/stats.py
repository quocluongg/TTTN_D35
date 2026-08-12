"""System statistics endpoint."""
import time

from fastapi import APIRouter

from ai.admin.logs import get_start_time
from ai.core.db import fetch_all_products, get_chunk_stats

router = APIRouter(prefix="/admin", tags=["admin-stats"])


@router.get("/stats")
async def get_system_stats():
    products = fetch_all_products()
    chunk_stats = get_chunk_stats()

    gemini_ok = False
    try:
        from ai.chatbot.llm_client import LLMClient
        gemini_ok = LLMClient().client is not None
    except Exception:
        pass

    uptime_s = int(time.time() - get_start_time())
    h, m = uptime_s // 3600, (uptime_s % 3600) // 60

    return {
        "total_products": len(products),
        "total_chunks": chunk_stats.get("total_chunks", 0),
        "synced_products": chunk_stats.get("synced_products", 0),
        "gemini_status": "connected" if gemini_ok else "disconnected",
        "phobert_status": "loaded",
        "uptime": f"{h}h {m}m",
        "chunk_by_type": chunk_stats.get("by_type", {}),
    }
