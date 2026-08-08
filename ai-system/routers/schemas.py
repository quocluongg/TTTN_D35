"""Pydantic schemas for API."""
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Chat request schema."""
    query: str = Field(..., min_length=1, max_length=1000)
    conversation_id: str | None = None
    user_id: str | None = None


class ChatResponse(BaseModel):
    """Chat response schema."""
    query: str
    response: str
    intent: str
    confidence: float
    sources: list[dict]
    entities: list[dict] = Field(default_factory=list)
    intent_display: str = ""


class SyncResponse(BaseModel):
    """Sync response schema."""
    status: str
    message: str
    chunks_created: int = 0


class StatsResponse(BaseModel):
    """Stats response schema."""
    total_products: int
    total_chunks: int
    faiss_vectors: int
    bm25_documents: int
    gemini_status: str
