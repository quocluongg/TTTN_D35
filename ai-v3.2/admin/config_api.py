"""System configuration endpoints."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter
from db.models import SystemConfig, ConfigUpdate
from config import get_settings

router = APIRouter(prefix="/admin/config", tags=["admin-config"])


@router.get("")
@router.get("/rag")
async def get_config():
    """Get current system configuration."""
    s = get_settings()

    return SystemConfig(
        gemini_model=s.GEMINI_MODEL,
        gemini_temperature=s.LLM_TEMPERATURE,
        top_k=s.TOP_K,
        rerank_top_k=s.RERANK_TOP_K,
        embedding_model=s.EMBEDDING_MODEL,
        embedding_device=s.EMBEDDING_DEVICE,
        embedding_batch_size=s.EMBEDDING_BATCH_SIZE,
        reranker_model=s.RERANKER_MODEL,
        reranker_device=s.RERANKER_DEVICE,
        nlu_confidence_threshold=s.NLU_CONFIDENCE_THRESHOLD,
        mmr_lambda=s.MMR_LAMBDA,
    )


@router.put("")
@router.put("/rag")
async def update_config(update: ConfigUpdate):
    """Update system configuration (runtime only, not persisted to .env)."""
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
        s.NLU_CONFIDENCE_THRESHOLD = update.nlu_confidence_threshold
        updated["nlu_confidence_threshold"] = update.nlu_confidence_threshold
    if update.mmr_lambda is not None:
        s.MMR_LAMBDA = update.mmr_lambda
        updated["mmr_lambda"] = update.mmr_lambda

    return {"status": "updated", "fields": updated}
