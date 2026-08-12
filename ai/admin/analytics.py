"""Analytics endpoint."""
from fastapi import APIRouter

from ai.admin.logs import get_chat_logs_raw

router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])


@router.get("")
async def get_analytics():
    logs = get_chat_logs_raw()
    intent_dist = {}
    for l in logs:
        intent_dist[l.get("intent", "unknown")] = intent_dist.get(l.get("intent", "unknown"), 0) + 1

    latencies = [l.get("latency_ms", 0) for l in logs]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0

    queries_with_sources = sum(1 for l in logs if l.get("sources_count", 0) > 0)
    hit_rate = queries_with_sources / len(logs) if logs else 0

    return {
        "total_queries": len(logs),
        "avg_latency_ms": round(avg_latency, 2),
        "intent_distribution": intent_dist,
        "source_hit_rate": round(hit_rate, 2),
    }
