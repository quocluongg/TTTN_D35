"""NLU schema: intent types, entity types, and result model."""
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class IntentType(str, Enum):
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
    GREETING = "greeting"


class EntityType(str, Enum):
    PRODUCT_NAME = "PRODUCT_NAME"
    BRAND = "BRAND"
    MODEL = "MODEL"
    PRICE = "PRICE"
    SPEC = "SPEC"


class ExtractedEntity(BaseModel):
    text: str = Field(..., description="Extracted entity text")
    entity_type: EntityType = Field(..., description="Entity type")
    start_char: int = Field(0, description="Start position in original query")
    end_char: int = Field(0, description="End position in original query")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Entity confidence")


class NLUResult(BaseModel):
    original_query: str = Field(..., description="Original user query")
    intent: IntentType = Field(..., description="Classified intent")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Intent confidence")
    entities: List[ExtractedEntity] = Field(default_factory=list, description="Extracted entities")
    intent_scores: Optional[Dict[str, float]] = Field(None, description="Per-intent scores")
