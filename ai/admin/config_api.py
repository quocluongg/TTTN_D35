"""System configuration endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from ai.config import get_settings

router = APIRouter(prefix="/admin/config", tags=["admin-config"])


class ConfigUpdate(BaseModel):
    gemini_model: Optional[str] = None
    gemini_temperature: Optional[float] = None
    top_k: Optional[int] = None
    rerank_top_k: Optional[int] = None
    nlu_confidence_threshold: Optional[float] = None
    mmr_lambda: Optional[float] = None
    off_topic_threshold: Optional[float] = None


@router.get("")
async def get_config():
    s = get_settings()
    return {
        "gemini_model": s.GEMINI_MODEL_NAME,
        "gemini_temperature": s.LLM_TEMPERATURE,
        "top_k": s.TOP_K,
        "rerank_top_k": s.RERANK_TOP_K,
        "nlu_confidence_threshold": s.NLU_CONFIDENCE_THRESHOLD,
        "mmr_lambda": s.MMR_LAMBDA,
        "off_topic_threshold": s.OFF_TOPIC_THRESHOLD,
        "embedding_model": s.EMBEDDING_MODEL,
        "reranker_model": s.RERANKER_MODEL,
    }


@router.put("")
async def update_config(update: ConfigUpdate):
    s = get_settings()
    updated = {}
    if update.top_k is not None:
        s.TOP_K = update.top_k
        updated["top_k"] = update.top_k
    if update.rerank_top_k is not None:
        s.RERANK_TOP_K = update.rerank_top_k
        updated["rerank_top_k"] = update.rerank_top_k
    if update.nlu_confidence_threshold is not None:
        s.NLU_CONFIDENCE_THRESHOLD = update.nlu_confidence_threshold
        updated["nlu_confidence_threshold"] = update.nlu_confidence_threshold
    if update.mmr_lambda is not None:
        s.MMR_LAMBDA = update.mmr_lambda
        updated["mmr_lambda"] = update.mmr_lambda
    if update.off_topic_threshold is not None:
        s.OFF_TOPIC_THRESHOLD = update.off_topic_threshold
        updated["off_topic_threshold"] = update.off_topic_threshold
    return {"status": "updated", "fields": updated}
