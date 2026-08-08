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


def build_retrieval_query(nlu_result: NLUResult) -> RetrievalQuery:
    """
    Phân tích NLUResult để xây dựng truy vấn tìm kiếm nâng cao (RetrievalQuery).
    """
    intent = nlu_result.intent
    product_names = []
    brands = []
    specs = []

    for entity in nlu_result.entities:
        if entity.entity_type == EntityType.PRODUCT_NAME or entity.entity_type == EntityType.MODEL:
            product_names.append(entity.text)
        elif entity.entity_type == EntityType.BRAND:
            brands.append(entity.text)
        elif entity.entity_type == EntityType.SPEC:
            specs.append(entity.text)

    # Xác định loại chunk ưu tiên theo intent
    preferred_chunk_types = []
    if intent == "ask_specs":
        preferred_chunk_types = ["spec", "faq", "description"]
    elif intent == "ask_price":
        preferred_chunk_types = ["spec", "description"]
    elif intent == "ask_warranty" or intent == "ask_promotion":
        preferred_chunk_types = ["policy", "faq", "description"]
    elif intent == "compare_products":
        preferred_chunk_types = ["spec", "description", "faq"]
    elif intent == "purchase_consultation":
        preferred_chunk_types = ["description", "spec", "faq"]

    # Đánh dấu cờ so sánh nếu intent là compare_products hoặc phát hiện nhiều hơn 1 tên sản phẩm
    is_comparison = (intent == "compare_products") or (len(product_names) > 1)

    filters = {}
    if len(brands) == 1 and not is_comparison:
        filters["brand"] = brands[0]

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
