"""Analytics endpoint."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter
from admin.logs import get_chat_logs_raw

router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])


@router.get("")
@router.get("/rag")
async def get_analytics():
    """Get RAG performance analytics."""
    chat_logs = get_chat_logs_raw()

    # Intent distribution
    intent_dist: dict[str, int] = {}
    for log in chat_logs:
        intent = log.get("intent", "unknown")
        intent_dist[intent] = intent_dist.get(intent, 0) + 1

    # Average latency
    latencies = [l.get("latency_ms", 0) for l in chat_logs]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0

    # Top queried products
    product_queries: dict[str, int] = {}
    for log in chat_logs:
        for source in log.get("sources", []):
            pid = source.get("product_id", "")
            if pid:
                product_queries[pid] = product_queries.get(pid, 0) + 1

    top_products = sorted(product_queries.items(), key=lambda x: -x[1])[:10]

    # Source hit rate
    queries_with_sources = sum(1 for l in chat_logs if l.get("sources_count", 0) > 0)
    hit_rate = queries_with_sources / len(chat_logs) if chat_logs else 0

    # Error rate
    error_queries = sum(1 for l in chat_logs if l.get("intent") == "error")
    error_rate = error_queries / len(chat_logs) if chat_logs else 0

    return {
        "total_queries": len(chat_logs),
        "avg_latency_ms": round(avg_latency, 2),
        "intent_distribution": intent_dist,
        "top_queried_products": [{"product_id": p, "count": c} for p, c in top_products],
        "source_hit_rate": round(hit_rate, 2),
        "error_rate": round(error_rate, 2),
    }
