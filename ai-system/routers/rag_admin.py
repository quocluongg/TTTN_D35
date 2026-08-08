"""RAG Admin API - Comprehensive system management."""
import sys
import os
import time
import logging
from datetime import datetime
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from core import retriever, llm_client
from core.nlu import process_query
from db.supabase_client import fetch_all_products, get_connection

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin/rag", tags=["rag-admin"])


# ============ SCHEMAS ============

class SystemStats(BaseModel):
    total_products: int
    total_chunks: int
    faiss_vectors: int
    bm25_documents: int
    gemini_status: str
    phobert_status: str
    uptime: str
    last_sync: Optional[str]


class ChunkInfo(BaseModel):
    id: str
    product_id: str
    product_name: str
    chunk_type: str
    text_preview: str
    brand: str
    category: str
    price: float


class SystemConfig(BaseModel):
    # LLM
    gemini_model: str
    gemini_temperature: float
    # Retrieval
    top_k: int
    rerank_top_k: int
    rrf_k: int
    # Embedding
    embedding_model: str
    embedding_device: str
    embedding_batch_size: int
    # Reranker
    reranker_model: str
    reranker_device: str
    # NLU
    nlu_confidence_threshold: float


class ConfigUpdate(BaseModel):
    gemini_model: Optional[str] = None
    gemini_temperature: Optional[float] = None
    top_k: Optional[int] = None
    rerank_top_k: Optional[int] = None
    embedding_batch_size: Optional[int] = None
    nlu_confidence_threshold: Optional[float] = None


class ChatLog(BaseModel):
    timestamp: str
    query: str
    intent: str
    confidence: float
    response_preview: str
    sources_count: int
    latency_ms: int


class SyncLog(BaseModel):
    timestamp: str
    product_id: str
    product_name: str
    action: str
    chunks_created: int
    status: str
    duration_ms: int


class Analytics(BaseModel):
    total_queries: int
    avg_latency_ms: float
    intent_distribution: dict
    top_queried_products: list
    source_hit_rate: float
    error_rate: float


# ============ IN-MEMORY LOGS ============

_chat_logs: list[dict] = []
_sync_logs: list[dict] = []
_start_time = time.time()


def log_chat(query: str, intent: str, confidence: float, response: str, sources: list, latency_ms: int):
    """Log chat interaction."""
    _chat_logs.append({
        "timestamp": datetime.now().isoformat(),
        "query": query,
        "intent": intent,
        "confidence": confidence,
        "response_preview": response[:200],
        "sources_count": len(sources),
        "latency_ms": latency_ms,
    })
    # Keep last 1000 logs
    if len(_chat_logs) > 1000:
        _chat_logs.pop(0)


def log_sync(product_id: str, product_name: str, action: str, chunks: int, status: str, duration_ms: int):
    """Log sync operation."""
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


# ============ ENDPOINTS ============

@router.get("/stats", response_model=SystemStats)
async def get_rag_stats():
    """Get comprehensive RAG system statistics."""
    products = fetch_all_products()
    index_stats = retriever.get_stats()
    gemini_ok = llm_client.test_connection()

    # Check PhoBERT status
    try:
        from core.nlu import _classifier
        phobert_ok = _classifier is not None
    except:
        phobert_ok = False

    # Calculate uptime
    uptime_seconds = int(time.time() - _start_time)
    hours = uptime_seconds // 3600
    minutes = (uptime_seconds % 3600) // 60
    uptime_str = f"{hours}h {minutes}m"

    # Last sync time
    last_sync = _sync_logs[-1]["timestamp"] if _sync_logs else None

    return SystemStats(
        total_products=len(products),
        total_chunks=index_stats["total_chunks"],
        faiss_vectors=index_stats["faiss_vectors"],
        bm25_documents=index_stats["bm25_documents"],
        gemini_status="connected" if gemini_ok else "disconnected",
        phobert_status="loaded" if phobert_ok else "not_loaded",
        uptime=uptime_str,
        last_sync=last_sync,
    )


@router.get("/chunks")
async def list_chunks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    chunk_type: Optional[str] = None,
    brand: Optional[str] = None,
    search: Optional[str] = None,
):
    """List chunks with pagination and filters."""
    from core.retriever import _chunk_metadata

    chunks = []
    for cid, meta in _chunk_metadata.items():
        m = meta.get("metadata", {})

        # Apply filters
        if chunk_type and m.get("chunk_type") != chunk_type:
            continue
        if brand and m.get("brand", "").upper() != brand.upper():
            continue
        if search and search.lower() not in meta.get("text", "").lower():
            continue

        chunks.append(ChunkInfo(
            id=cid,
            product_id=m.get("product_id", ""),
            product_name=m.get("product_name", "")[:50],
            chunk_type=m.get("chunk_type", ""),
            text_preview=meta.get("text", "")[:150],
            brand=m.get("brand", ""),
            category=m.get("category", ""),
            price=m.get("price", 0),
        ))

    # Sort by product name
    chunks.sort(key=lambda x: x.product_name)

    # Pagination
    total = len(chunks)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = chunks[start:end]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "chunks": [c.dict() for c in paginated],
    }


@router.delete("/chunks/{chunk_id}")
async def delete_chunk(chunk_id: str):
    """Delete a specific chunk."""
    from core.retriever import _chunk_metadata, _bm25_corpus

    if chunk_id not in _chunk_metadata:
        raise HTTPException(404, "Chunk not found")

    # Remove from metadata
    del _chunk_metadata[chunk_id]

    # Remove from BM25
    if chunk_id in _bm25_corpus:
        del _bm25_corpus[chunk_id]

    # Note: FAISS doesn't support efficient single deletion
    # Full rebuild needed for FAISS

    return {"status": "deleted", "chunk_id": chunk_id}


@router.post("/chunks/rebuild")
async def rebuild_index():
    """Rebuild FAISS and BM25 indices from Supabase."""
    from db.supabase_client import fetch_all_products
    from core.chunker import chunk_product
    from core.embedder import encode_texts
    from core import retriever

    products = fetch_all_products()
    if not products:
        raise HTTPException(400, "No products found")

    # Generate chunks
    all_chunks = []
    for p in products:
        chunks = chunk_product(p)
        all_chunks.extend(chunks)

    # Generate embeddings
    texts = [c.text for c in all_chunks]
    embeddings = encode_texts(texts)
    for chunk, emb in zip(all_chunks, embeddings):
        chunk.embedding = emb.tolist()

    # Rebuild index
    retriever.load_index()
    retriever.index_chunks(all_chunks)

    return {
        "status": "rebuilt",
        "products": len(products),
        "chunks": len(all_chunks),
    }


@router.get("/config", response_model=SystemConfig)
async def get_config():
    """Get current system configuration."""
    from config import get_settings
    s = get_settings()

    return SystemConfig(
        gemini_model=s.GEMINI_MODEL,
        gemini_temperature=s.LLM_TEMPERATURE,
        top_k=s.TOP_K,
        rerank_top_k=s.RERANK_TOP_K,
        rrf_k=60,
        embedding_model=s.EMBEDDING_MODEL,
        embedding_device=s.EMBEDDING_DEVICE,
        embedding_batch_size=s.EMBEDDING_BATCH_SIZE,
        reranker_model=s.RERANKER_MODEL,
        reranker_device=s.RERANKER_DEVICE,
        nlu_confidence_threshold=0.45,
    )


@router.put("/config")
async def update_config(update: ConfigUpdate):
    """Update system configuration."""
    from config import get_settings
    s = get_settings()

    updated = {}
    if update.gemini_model is not None:
        s.GEMINI_MODEL = update.gemini_model
        updated["gemini_model"] = update.gemini_model
    if update.gemini_temperature is not None:
        s.LLM_TEMPERATURE = update.gemini_temperature
        updated["gemini_temperature"] = update.gemini_temperature
    if update.top_k is not None:
        s.TOP_K = update.top_k
        updated["top_k"] = update.top_k
    if update.rerank_top_k is not None:
        s.RERANK_TOP_K = update.rerank_top_k
        updated["rerank_top_k"] = update.rerank_top_k
    if update.embedding_batch_size is not None:
        s.EMBEDDING_BATCH_SIZE = update.embedding_batch_size
        updated["embedding_batch_size"] = update.embedding_batch_size
    if update.nlu_confidence_threshold is not None:
        updated["nlu_confidence_threshold"] = update.nlu_confidence_threshold

    return {"status": "updated", "fields": updated}


@router.get("/logs/chat")
async def get_chat_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    intent: Optional[str] = None,
):
    """Get chat history logs."""
    logs = _chat_logs.copy()

    # Filter by intent
    if intent:
        logs = [l for l in logs if l.get("intent") == intent]

    # Reverse (newest first)
    logs.reverse()

    # Pagination
    total = len(logs)
    start = (page - 1) * page_size
    end = start + page_size

    return {
        "total": total,
        "page": page,
        "logs": logs[start:end],
    }


@router.get("/logs/sync")
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
        "logs": logs[start:end],
    }


@router.get("/analytics", response_model=Analytics)
async def get_analytics():
    """Get RAG performance analytics."""
    # Intent distribution
    intent_dist = {}
    for log in _chat_logs:
        intent = log.get("intent", "unknown")
        intent_dist[intent] = intent_dist.get(intent, 0) + 1

    # Average latency
    latencies = [l.get("latency_ms", 0) for l in _chat_logs]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0

    # Top queried products
    product_queries = {}
    for log in _chat_logs:
        for source in log.get("sources", []):
            pid = source.get("product_id", "")
            if pid:
                product_queries[pid] = product_queries.get(pid, 0) + 1

    top_products = sorted(product_queries.items(), key=lambda x: -x[1])[:10]

    # Source hit rate
    queries_with_sources = sum(1 for l in _chat_logs if l.get("sources_count", 0) > 0)
    hit_rate = queries_with_sources / len(_chat_logs) if _chat_logs else 0

    return Analytics(
        total_queries=len(_chat_logs),
        avg_latency_ms=round(avg_latency, 2),
        intent_distribution=intent_dist,
        top_queried_products=[{"product_id": p, "count": c} for p, c in top_products],
        source_hit_rate=round(hit_rate, 2),
        error_rate=0.0,
    )


@router.post("/test-query")
async def test_query(query: str):
    """Test NLU + Retrieval for a query."""
    start = time.time()

    # NLU
    nlu_result = process_query(query)

    # Retrieval
    search_results = retriever.search(query, top_k=5)

    latency = int((time.time() - start) * 1000)

    return {
        "query": query,
        "nlu": {
            "intent": nlu_result.intent,
            "intent_display": nlu_result.intent_display,
            "confidence": nlu_result.confidence,
            "entities": [{"text": e.text, "type": e.entity_type} for e in nlu_result.entities],
            "is_out_of_scope": nlu_result.is_out_of_scope,
        },
        "retrieval": {
            "results_count": len(search_results),
            "top_results": [
                {
                    "id": r["id"],
                    "text": r["text"][:100],
                    "score": round(r["score"], 3),
                    "source": r.get("source", "hybrid"),
                }
                for r in search_results[:5]
            ],
        },
        "latency_ms": latency,
    }
