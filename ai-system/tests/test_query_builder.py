"""
Unit test thuần Python cho module Query Builder (không phụ thuộc DB/Model).
"""
# pyrefly: ignore [missing-import]
import pytest
from nlu.schema import NLUResult, ExtractedEntity, EntityType
from retrieval.query_builder import build_retrieval_query


def test_build_query_single_product_ask_specs():
    nlu_res = NLUResult(
        original_query="Cấu hình RAM và chip của Laptop Asus ROG thế nào?",
        intent="ask_specs",
        confidence=0.92,
        entities=[
            ExtractedEntity(text="Asus", entity_type=EntityType.BRAND),
            ExtractedEntity(text="RAM 16GB", entity_type=EntityType.SPEC),
        ],
    )

    query = build_retrieval_query(nlu_res)
    assert query.intent == "ask_specs"
    assert "spec" in query.preferred_chunk_types
    assert query.is_comparison is False
    assert query.filters.get("brand") == "Asus"


def test_build_query_comparison():
    nlu_res = NLUResult(
        original_query="So sánh Macbook Air M2 và Dell XPS 13",
        intent="compare_products",
        confidence=0.95,
        entities=[
            ExtractedEntity(text="Macbook Air M2", entity_type=EntityType.PRODUCT_NAME),
            ExtractedEntity(text="Dell XPS 13", entity_type=EntityType.PRODUCT_NAME),
        ],
    )

    query = build_retrieval_query(nlu_res)
    assert query.intent == "compare_products"
    assert query.is_comparison is True
    assert len(query.product_names) == 2
