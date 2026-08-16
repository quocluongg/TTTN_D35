"""Pydantic models for API request/response schemas."""
import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


# ============ PRODUCT SCHEMAS ============


class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    brand: str = Field(..., min_length=1, max_length=100)
    category: str | None = None
    price: int = Field(..., gt=0)
    specs: dict[str, str] = Field(default_factory=dict)
    description: str = ""
    promotions: str | None = None
    warranty: str | None = None
    use_case: str | None = None


class ProductUpdateRequest(BaseModel):
    """Partial update - only sent fields are updated."""
    name: str | None = None
    brand: str | None = None
    category: str | None = None
    price: int | None = Field(default=None, gt=0)
    specs: dict[str, str] | None = None
    description: str | None = None
    promotions: str | None = None
    warranty: str | None = None
    use_case: str | None = None


class ProductResponse(BaseModel):
    id: str
    status: str
    message: str


class ProductStatusResponse(BaseModel):
    id: str
    status: str


# ============ CONVERSATION & LINKED MESSAGES SCHEMAS ============


class ConversationCreateRequest(BaseModel):
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ConversationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    status: str
    started_at: str
    metadata: Optional[Dict[str, Any]] = None


class LinkedMessageSchema(BaseModel):
    id: str
    conversation_id: str
    parent_id: Optional[str] = None
    role: str
    content: str
    confidence: Optional[float] = None
    sources: Optional[List[Any]] = None
    suggested_products: Optional[List[Any]] = None
    provider: Optional[str] = "gemini"
    created_at: str


class ProductCard(BaseModel):
    id: str
    slug: str
    name: str
    brand: str
    thumbnail: str
    price_from: float
    category_name: str
    rating_avg: float
    review_count: int
    product_url: str


class ChatRequest(BaseModel):
    q: str = Field(..., description="Câu hỏi hoặc yêu cầu tư vấn")
    top_k: int = Field(5, ge=1, le=20)
    conversation_id: Optional[str] = None
    parent_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    intent: str
    confidence: float
    products: List[ProductCard] = Field(default_factory=list)
    sources: List[Any] = Field(default_factory=list)
    query: Optional[str] = None
    answer: Optional[str] = None
    entities: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    retrieved_products: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    recommended_products: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    conversation_id: Optional[str] = None
    message_id: Optional[str] = None
    user_message_id: Optional[str] = None
    parent_id: Optional[str] = None
    history_length: Optional[int] = 0
    validation: Optional[Dict[str, Any]] = None


# ============ ADMIN SCHEMAS ============


class SystemStats(BaseModel):
    total_products: int
    total_chunks: int
    synced_products: int
    pgvector_vectors: int
    bm25_documents: int
    gemini_status: str
    phobert_status: str
    uptime: str
    last_sync: Optional[str] = None


class ChunkInfo(BaseModel):
    id: str
    product_id: str
    product_name: str
    chunk_type: str
    text_preview: str
    category: str
    price: float
    similarity: Optional[float] = None


class SystemConfig(BaseModel):
    gemini_model: str
    gemini_temperature: float
    top_k: int
    rerank_top_k: int
    embedding_model: str
    embedding_device: str
    embedding_batch_size: int
    reranker_model: str
    reranker_device: str
    nlu_confidence_threshold: float
    mmr_lambda: float


class ConfigUpdate(BaseModel):
    gemini_model: Optional[str] = None
    gemini_temperature: Optional[float] = None
    top_k: Optional[int] = None
    rerank_top_k: Optional[int] = None
    embedding_batch_size: Optional[int] = None
    nlu_confidence_threshold: Optional[float] = None
    mmr_lambda: Optional[float] = None


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


class SyncStatusItem(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    price: float
    chunk_count: int
    status: str  # "synced" or "not_synced"
