"""Admin router - System management."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter
from core.retriever import get_stats
from core.llm_client import test_connection
from db.supabase_client import fetch_all_products
from routers.schemas import StatsResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=StatsResponse)
async def get_system_stats():
    """Get system statistics."""
    products = fetch_all_products()
    index_stats = get_stats()
    gemini_ok = test_connection()

    return StatsResponse(
        total_products=len(products),
        total_chunks=index_stats["total_chunks"],
        faiss_vectors=index_stats["faiss_vectors"],
        bm25_documents=index_stats["bm25_documents"],
        gemini_status="connected" if gemini_ok else "disconnected",
    )


@router.get("/products")
async def list_products(limit: int = 20, offset: int = 0):
    """List products in database."""
    products = fetch_all_products()
    return {
        "total": len(products),
        "products": products[offset:offset + limit],
    }


@router.get("/chunks/{product_id}")
async def get_product_chunks(product_id: str):
    """Get chunks for a specific product."""
    from core.retriever import _chunk_metadata

    chunks = [
        {"id": cid, "text": meta["text"][:200], "type": meta["metadata"].get("chunk_type")}
        for cid, meta in _chunk_metadata.items()
        if meta["metadata"].get("product_id") == product_id
    ]

    return {"product_id": product_id, "chunks": chunks}
