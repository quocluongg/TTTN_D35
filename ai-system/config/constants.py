from pydantic import Field
from pydantic import BaseModel
from enum import StrEnum


class ChunkType(StrEnum):
    SPEC = "spec"
    DESCRIPTION = "description"
    FAQ = "faq"
    POLICY = "policy"  # gộp khuyến mãi + bảo hành


class ProductStatus(StrEnum):
    PROCESSING = "processing"   # vừa insert/update, đang chờ index
    ACTIVE = "active"           # đã index xong, chatbot có thể dùng
    FAILED = "failed"           # index lỗi, cần retry / kiểm tra thủ công
    DELETED = "deleted"         # soft-delete (nếu không muốn xóa cứng)


class SyncAction(StrEnum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"


# Danh sách intent cho module NLU (dùng ở phần chatbot, để sẵn cho đồng bộ)
INTENT_LABELS = [
    "ask_specs",
    "compare_products",
    "ask_price",
    "ask_warranty",
    "purchase_consultation",
    "ask_promotion",
    "order_product",
    "complain",
    "general_query",
    "out_of_scope",
]

class EntityType(StrEnum):

    PRODUCT_NAME = "PRODUCT_NAME"
    BRAND = "BRAND"
    MODEL = "MODEL"
    PRICE = "PRICE"
    SPEC = "SPEC"                            # Thông số (VD: RAM 16GB, SSD 512GB, RTX 4060, OLED 120Hz)


class ExtractedEntity(BaseModel):
    text: str = Field(..., description="Văn bản thực thể trích xuất được")
    entity_type: EntityType = Field(..., description="Loại thực thể NER")
    start_char: int = Field(0, description="Vị trí bắt đầu trong câu gốc")
    end_char: int = Field(0, description="Vị trí kết thúc trong câu gốc")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Độ tin cậy của thực thể (0.0 - 1.0)")
