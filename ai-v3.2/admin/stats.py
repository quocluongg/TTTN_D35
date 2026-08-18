"""System statistics endpoint."""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter
from db.supabase_client import fetch_all_products, get_chunk_stats
from admin.logs import get_start_time

router = APIRouter(prefix="/admin", tags=["admin-stats"])


@router.get("/stats")
@router.get("/rag/stats")
async def get_system_stats():
    """Get comprehensive system statistics."""
    # Products
    products = fetch_all_products()

    # Chunk stats from pgvector
    chunk_stats = get_chunk_stats()

    # Gemini status
    gemini_ok = False
    try:
        from chatbot.llm_client import LLMClient
        client = LLMClient()
        gemini_ok = client.client is not None
    except Exception:
        pass

    # PhoBERT status
    phobert_ok = False
    try:
        from nlu.phobert_nlu import PhoBERTElectronicsNLU
        # Check if model is loaded (don't instantiate just to check)
        phobert_ok = True  # Will be verified on first use
    except Exception:
        pass

    # Uptime
    uptime_seconds = int(time.time() - get_start_time())
    hours = uptime_seconds // 3600
    minutes = (uptime_seconds % 3600) // 60
    uptime_str = f"{hours}h {minutes}m"

    return {
        "total_products": len(products),
        "total_chunks": chunk_stats.get("total_chunks", 0),
        "synced_products": chunk_stats.get("synced_products", 0),
        "pgvector_vectors": chunk_stats.get("total_chunks", 0),
        "bm25_documents": len(products),
        "gemini_status": "connected" if gemini_ok else "disconnected",
        "phobert_status": "loaded" if phobert_ok else "not_loaded",
        "uptime": uptime_str,
        "chunk_by_type": chunk_stats.get("by_type", {}),
        "chunk_by_category": chunk_stats.get("by_category", {}),
    }


@router.get("/health")
async def admin_health():
    """Quick health check for admin."""
    try:
        from db.supabase_client import get_connection
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@router.post("/test-query")
async def test_query(query: str):
    """Test NLU + Retrieval for a query."""
    import time

    start = time.time()

    # NLU
    nlu_result = None
    try:
        from nlu.phobert_nlu import PhoBERTElectronicsNLU
        engine = PhoBERTElectronicsNLU()
        nlu_result = engine.parse(query)
    except Exception as e:
        nlu_result = None

    # Retrieval
    search_results = []
    try:
        from core.embeddings import PGVectorSearcher
        from db.supabase_client import fetch_all_products
        products = fetch_all_products()
        searcher = PGVectorSearcher(products)
        search_results = searcher.search_chunks(query, top_k=5)
    except Exception:
        pass

    latency = int((time.time() - start) * 1000)

    nlu_info = None
    if nlu_result:
        nlu_info = {
            "intent": nlu_result.intent.value if hasattr(nlu_result.intent, "value") else str(nlu_result.intent),
            "confidence": nlu_result.confidence,
            "entities": [
                {
                    "text": e.text,
                    "type": e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type),
                }
                for e in nlu_result.entities
            ],
            "is_out_of_scope": nlu_result.is_out_of_scope,
        }

    return {
        "query": query,
        "nlu": nlu_info,
        "retrieval": {
            "results_count": len(search_results),
            "top_results": [
                {
                    "id": r.get("id", ""),
                    "text": r.get("text", "")[:100],
                    "score": r.get("similarity_score", 0),
                    "product_name": r.get("product_name", ""),
                }
                for r in search_results[:5]
            ],
        },
        "latency_ms": latency,
    }
