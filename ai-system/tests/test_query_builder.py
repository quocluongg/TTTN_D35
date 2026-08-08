"""
Unit test thuần Python cho module Query Builder (không phụ thuộc DB/Model).
Kiểm tra intent-to-chunk mapping và filter logic.
"""
import pytest
from nlu.schema import NLUResult, ExtractedEntity, EntityType
from retrieval.query_builder import build_retrieval_query


def test_spec_query_builds_correct_filter():
    nlu_result = NLUResult(
        original_query="Cấu hình RAM và chip của Laptop Asus ROG thế nào?",
        intent="ask_specs",
        confidence=0.92,
        entities=[
            ExtractedEntity(text="ASUS", entity_type=EntityType.BRAND),
            ExtractedEntity(text="RAM", entity_type=EntityType.SPEC),
        ],
        is_out_of_scope=False,
    )

    query = build_retrieval_query(nlu_result)

    assert query.preferred_chunk_types == ["spec", "faq", "description"]
    assert query.filters.get("brand") == "ASUS"
    assert "RAM" in query.original_query or query.search_text


def test_comparison_query_no_filter():
    nlu_result = NLUResult(
        original_query="So sánh ASUS và MSI",
        intent="compare_products",
        confidence=0.88,
        entities=[
            ExtractedEntity(text="ASUS", entity_type=EntityType.BRAND),
            ExtractedEntity(text="MSI", entity_type=EntityType.BRAND),
        ],
        is_out_of_scope=False,
    )

    query = build_retrieval_query(nlu_result)

    assert "spec" in query.preferred_chunk_types
    assert "description" in query.preferred_chunk_types
    assert query.is_comparison is True
    assert len(query.filters) == 0


def test_warranty_query_policy_chunks():
    nlu_result = NLUResult(
        original_query="Chế độ bảo hành laptop ASUS như thế nào?",
        intent="ask_warranty",
        confidence=0.85,
        entities=[
            ExtractedEntity(text="ASUS", entity_type=EntityType.BRAND),
        ],
        is_out_of_scope=False,
    )

    query = build_retrieval_query(nlu_result)

    assert "policy" in query.preferred_chunk_types
    assert "faq" in query.preferred_chunk_types


def test_purchase_advice_category_filter():
    nlu_result = NLUResult(
        original_query="Tư vấn laptop gaming",
        intent="purchase_consultation",
        confidence=0.9,
        entities=[
            ExtractedEntity(text="Laptop Gaming", entity_type=EntityType.PRODUCT_NAME),
        ],
        is_out_of_scope=False,
    )

    query = build_retrieval_query(nlu_result)

    assert "description" in query.preferred_chunk_types
    assert "spec" in query.preferred_chunk_types


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
