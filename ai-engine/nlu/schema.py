from enum import Enum
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class IntentType(str, Enum):
    ASK_SPECS = "ask_specs"                    # Hỏi thông số kỹ thuật (RAM, Chip, Màn hình, Pin...)
    COMPARE_PRODUCTS = "compare_products"      # So sánh 2 hoặc nhiều sản phẩm
    ASK_PRICE = "ask_price"                    # Hỏi giá bán / khoảng giá
    ASK_WARRANTY = "ask_warranty"              # Hỏi chính sách bảo hành, đổi trả
    PURCHASE_CONSULTATION = "purchase_consultation" # Tư vấn chọn mua theo nhu cầu/tầm giá
    ASK_PROMOTION = "ask_promotion"            # Hỏi chương trình khuyến mãi, ưu đãi sinh viên
    ORDER_PRODUCT = "order_product"            # Ý định đặt hàng / mua ngay
    COMPLAIN = "complain"                      # Khiếu nại, lỗi sản phẩm, đổi mới
    GENERAL_QUERY = "general_query"            # Hỏi đáp chung / fallback


class EntityType(str, Enum):
    PRODUCT_NAME = "PRODUCT_NAME"              # Tên đầy đủ sản phẩm (VD: Macbook Air M2 2022)
    BRAND = "BRAND"                            # Thương hiệu (VD: Asus, Dell, Apple, Samsung, Lenovo)
    MODEL = "MODEL"                            # Dòng sản phẩm (VD: TUF Gaming, Aspire 5, Legion, ROG)
    PRICE = "PRICE"                            # Khoảng giá / mức giá (VD: 20 triệu, dưới 15tr)
    SPEC = "SPEC"                              # Thông số (VD: RAM 16GB, SSD 512GB, RTX 4060, OLED 120Hz)


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
