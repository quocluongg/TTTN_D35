from enum import Enum
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class IntentType(str, Enum):
    GREETING = "greeting"                      # Chào hỏi
    ASK_SPECS = "ask_specs"                    # Hỏi thông số kỹ thuật
    COMPARE_PRODUCTS = "compare_products"      # So sánh sản phẩm
    ASK_PRICE = "ask_price"                    # Hỏi giá bán
    ASK_WARRANTY = "ask_warranty"              # Hỏi bảo hành
    PURCHASE_CONSULTATION = "purchase_consultation" # Tư vấn chọn mua
    ASK_PROMOTION = "ask_promotion"            # Hỏi khuyến mãi
    ORDER_PRODUCT = "order_product"            # Đặt mua hàng
    COMPLAIN = "complain"                      # Khiếu nại / lỗi sản phẩm
    GENERAL_QUERY = "general_query"            # Hỏi đáp chung
    OUT_OF_SCOPE = "out_of_scope"              # Câu hỏi ngoài phạm vi (OOS)


class EntityType(str, Enum):
    PRODUCT_NAME = "PRODUCT_NAME"
    BRAND = "BRAND"
    MODEL = "MODEL"
    CATEGORY = "CATEGORY"                    # Danh mục sản phẩm (VD: laptop, điện thoại, tivi)
    PRICE = "PRICE"
    SPEC = "SPEC"                            # Thông số (VD: RAM 16GB, SSD 512GB, RTX 4060, OLED 120Hz)


class ExtractedEntity(BaseModel):
    text: str = Field(..., description="Văn bản thực thể trích xuất được")
    entity_type: EntityType = Field(..., description="Loại thực thể NER")
    start_char: int = Field(0, description="Vị trí bắt đầu trong câu gốc")
    end_char: int = Field(0, description="Vị trí kết thúc trong câu gốc")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Độ tin cậy của thực thể (0.0 - 1.0)")


class NLUResult(BaseModel):
    original_query: str = Field(..., description="Truy vấn ban đầu của người dùng")
    intent: IntentType = Field(..., description="Ý định phân loại được")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Độ tin cậy của intent")
    entities: List[ExtractedEntity] = Field(default_factory=list, description="Danh sách thực thể trích xuất")
    intent_scores: Optional[Dict[str, float]] = Field(None, description="Điểm xác suất của 8 loại intent")
