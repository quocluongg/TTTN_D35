"""
Query Builder: Chuyển đổi NLUResult thành RetrievalQuery cấu trúc.
Xác định danh sách filters (brand, category, chunk_type) và query text để tìm kiếm hybrid.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

from nlu.schema import NLUResult, EntityType


@dataclass
class RetrievalQuery:
    original_query: str
    search_text: str
    intent: str
    product_names: List[str] = field(default_factory=list)
    brands: List[str] = field(default_factory=list)
    preferred_chunk_types: List[str] = field(default_factory=list)
    filters: Dict[str, Any] = field(default_factory=dict)
    is_comparison: bool = False


# Intent → Preferred Chunk Types mapping
INTENT_CHUNK_MAP: Dict[str, List[str]] = {
    "ask_specs": ["spec", "faq", "description"],
    "ask_price": ["spec", "description"],
    "ask_warranty": ["policy", "faq", "description"],
    "ask_promotion": ["policy", "faq", "description"],
    "compare_products": ["spec", "description", "faq"],
    "purchase_consultation": ["description", "spec", "faq"],
    "order_product": ["faq"],
    "complain": ["faq", "policy"],
    "general_query": ["description", "spec"],
    "out_of_scope": [],
}


def build_retrieval_query(nlu_result: NLUResult) -> RetrievalQuery:
    """
    IPO Model:
    - Input: nlu_result (Đối tượng NLUResult chứa intent, entities, original_query)
    - Process:
        Step 1: Phân loại danh sách thực thể thành product_names, brands, specs
        Step 2: Ánh xạ Intent để xác định danh sách loại chunk ưu tiên (preferred_chunk_types) từ INTENT_CHUNK_MAP
        Step 3: Đánh dấu cờ so sánh (is_comparison) nếu intent so sánh hoặc trích xuất nhiều model
        Step 4: Xây dựng bộ lọc metadata filters (ví dụ: brand) khi áp dụng tìm kiếm chính xác
        Step 5: Trả về đối tượng RetrievalQuery cấu trúc
    - Output: RetrievalQuery chứa search_text, intent, filters, preferred_chunk_types và is_comparison
    """
    # Step 1: Khởi tạo biến lưu vết intent và danh sách thực thể
    intent = nlu_result.intent
    product_names = []
    brands = []
    specs = []

    # Step 2: Lặp qua từng thực thể NER để phân loại
    for entity in nlu_result.entities:
        if entity.entity_type == EntityType.PRODUCT_NAME or entity.entity_type == EntityType.MODEL:
            product_names.append(entity.text)
        elif entity.entity_type == EntityType.BRAND:
            brands.append(entity.text)
        elif entity.entity_type == EntityType.SPEC:
            specs.append(entity.text)

    # Step 3: Xác định loại chunk ưu tiên theo intent người dùng từ INTENT_CHUNK_MAP
    preferred_chunk_types = INTENT_CHUNK_MAP.get(intent, ["description", "spec"])

    # Step 4: Kiểm tra điều kiện so sánh nhiều sản phẩm
    is_comparison = (intent == "compare_products") or (len(product_names) > 1)

    # Step 5: Thiết lập bộ lọc metadata filter nếu chỉ tìm kiếm 1 thương hiệu duy nhất
    filters = {}
    if len(brands) == 1 and not is_comparison:
        filters["brand"] = brands[0]

    # Step 6: Đóng gói và trả về RetrievalQuery
    return RetrievalQuery(
        original_query=nlu_result.original_query,
        search_text=nlu_result.original_query,
        intent=intent,
        product_names=product_names,
        brands=brands,
        preferred_chunk_types=preferred_chunk_types,
        filters=filters,
        is_comparison=is_comparison,
    )

