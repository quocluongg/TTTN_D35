import uuid

from pydantic import BaseModel, Field


class FAQItem(BaseModel):
    question: str
    answer: str


class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    brand: str = Field(..., min_length=1, max_length=100)
    category: str | None = None
    price: int = Field(..., gt=0)
    specs: dict[str, str] = Field(default_factory=dict)
    description: str = ""
    promotions: str | None = None
    warranty: str | None = None
    faqs: list[FAQItem] = Field(default_factory=list)


class ProductUpdateRequest(BaseModel):
    """Tất cả field optional - chỉ field nào gửi lên mới được update (partial update)."""
    name: str | None = None
    brand: str | None = None
    category: str | None = None
    price: int | None = Field(default=None, gt=0)
    specs: dict[str, str] | None = None
    description: str | None = None
    promotions: str | None = None
    warranty: str | None = None
    faqs: list[FAQItem] | None = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    status: str
    message: str


class ProductStatusResponse(BaseModel):
    id: uuid.UUID
    status: str


# ---- Chat RAG Schemas ----
class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Câu hỏi truy vấn từ người dùng")
    session_id: str | None = Field(default=None, description="Mã phiên hội thoại (tùy chọn)")


class SourceDocument(BaseModel):
    id: str
    text: str
    metadata: dict = Field(default_factory=dict)
    score: float = 0.0


class NLUInfo(BaseModel):
    intent: str
    confidence: float
    entities: list[dict] = Field(default_factory=list)
    is_out_of_scope: bool = False


class ChatResponse(BaseModel):
    query: str
    response: str
    nlu_info: NLUInfo
    sources: list[SourceDocument] = Field(default_factory=list)
    validation_status: dict = Field(default_factory=dict)


# ---- 3-Stage Pipeline Test Schemas ----
class Stage1NLUResponse(BaseModel):
    query: str
    intent: str
    confidence: float
    entities: list[dict] = Field(default_factory=list)
    intent_scores: dict[str, float] = Field(default_factory=dict)
    is_out_of_scope: bool


class Stage2RetrievalResponse(BaseModel):
    query: str
    search_text: str
    filters: dict = Field(default_factory=dict)
    preferred_chunk_types: list[str] = Field(default_factory=list)
    total_docs: int
    documents: list[SourceDocument] = Field(default_factory=list)


class Stage3GenerationResponse(BaseModel):
    query: str
    nlu_intent: str
    reranked_docs: list[SourceDocument] = Field(default_factory=list)
    prompt_used: str
    raw_response: str
    sanitized_response: str
    validation_status: dict = Field(default_factory=dict)


