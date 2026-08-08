"""Health check router."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter
from core.retriever import get_stats
from core.llm_client import test_connection

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Check system health."""
    stats = get_stats()
    gemini_ok = test_connection()

    return {
        "status": "ok",
        "version": "2.0.0",
        "index": stats,
        "gemini": "connected" if gemini_ok else "disconnected",
    }
