"""
Schema dữ liệu đầu ra của NLU Stage.
"""
from enum import StrEnum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class IntentType(StrEnum):
    ASK_SPECS = "ask_specs"
    COMPARE_PRODUCTS = "compare_products"
    ASK_PRICE = "ask_price"
    ASK_WARRANTY = "ask_warranty"
    PURCHASE_CONSULTATION = "purchase_consultation"
    ASK_PROMOTION = "ask_promotion"
    ORDER_PRODUCT = "order_product"
    COMPLAIN = "complain"
    GENERAL_QUERY = "general_query"
    OUT_OF_SCOPE = "out_of_scope"


class EntityType(StrEnum):
    PRODUCT_NAME = "PRODUCT_NAME"
    BRAND = "BRAND"
    MODEL = "MODEL"
    PRICE = "PRICE"
    SPEC = "SPEC"


class ExtractedEntity(BaseModel):
    text: str = Field(..., description="Văn bản thực thể trích xuất được")
    entity_type: EntityType = Field(..., description="Loại thực thể NER")
    start_char: int = Field(0, description="Vị trí bắt đầu trong câu gốc")
    end_char: int = Field(0, description="Vị trí kết thúc trong câu gốc")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Độ tin cậy của thực thể")


class NLUResult(BaseModel):
    original_query: str = Field(..., description="Truy vấn ban đầu của người dùng")
    intent: str = Field(..., description="Ý định phân loại được")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Độ tin cậy của intent")
    entities: List[ExtractedEntity] = Field(default_factory=list, description="Danh sách thực thể trích xuất")
    intent_scores: Optional[Dict[str, float]] = Field(None, description="Điểm xác suất của các loại intent")
    is_out_of_scope: bool = Field(False, description="Cờ đánh dấu out of scope")
