import pytest
from data_pipeline.chunking.chunk_orchestrator import chunk_product
from data_pipeline.chunking.chunk_schema import Chunk


@pytest.fixture
def sample_product():
    return {
        "id": "test-uuid-123",
        "name": "Laptop ASUS ROG Strix G16",
        "brand": "ASUS",
        "category": "Laptop Gaming",
        "price": 42990000,
        "description": "Laptop gaming cao cấp với thiết kế hầm hố, hiệu năng mạnh mẽ.",
        "specifications": {
            "CPU": "Intel Core i9-14900HX",
            "RAM": "32GB DDR5",
            "GPU": "NVIDIA RTX 4070",
            "Storage": "1TB SSD NVMe",
            "Display": "16 inch QHD 240Hz"
        },
        "warranty": "24 tháng chính hãng ASUS",
        "faqs": [
            {
                "question": "Laptop này chơi được game AAA không?",
                "answer": "Có, với RTX 4070 chiến mượt mọi game AAA."
            }
        ]
    }


def test_chunk_product_returns_four_types(sample_product):
    chunks = chunk_product(sample_product)

    chunk_types = {c.chunk_type for c in chunks}
    assert "spec" in chunk_types
    assert "description" in chunk_types
    assert "faq" in chunk_types
    assert "policy" in chunk_types


def test_chunk_ids_follow_format(sample_product):
    chunks = chunk_product(sample_product)

    for chunk in chunks:
        assert chunk.id.startswith("test-uuid-123_")
        assert "_" in chunk.id


def test_spec_chunk_contains_all_specs(sample_product):
    chunks = chunk_product(sample_product)
    spec_chunk = next(c for c in chunks if c.chunk_type == "spec")

    assert "CPU" in spec_chunk.text
    assert "Intel Core i9-14900HX" in spec_chunk.text
    assert "RAM" in spec_chunk.text
    assert "32GB DDR5" in spec_chunk.text
    assert "42.990.000" in spec_chunk.text


def test_description_chunk_contains_description(sample_product):
    chunks = chunk_product(sample_product)
    desc_chunk = next(c for c in chunks if c.chunk_type == "description")

    assert "Laptop gaming cao cấp" in desc_chunk.text
    assert "ASUS ROG Strix G16" in desc_chunk.text


def test_faq_chunk_contains_questions(sample_product):
    chunks = chunk_product(sample_product)
    faq_chunk = next(c for c in chunks if c.chunk_type == "faq")

    assert "game AAA" in faq_chunk.text
    assert "RTX 4070" in faq_chunk.text


def test_policy_chunk_contains_warranty(sample_product):
    chunks = chunk_product(sample_product)
    policy_chunk = next(c for c in chunks if c.chunk_type == "policy")

    assert "24 tháng" in policy_chunk.text
    assert "ASUS" in policy_chunk.text


def test_chunks_have_metadata(sample_product):
    chunks = chunk_product(sample_product)

    for chunk in chunks:
        assert chunk.metadata.get("product_name") == "Laptop ASUS ROG Strix G16"
        assert chunk.metadata.get("brand") == "ASUS"
        assert chunk.metadata.get("category") == "Laptop Gaming"
        assert chunk.metadata.get("price") == 42990000


def test_empty_product_returns_empty_list():
    chunks = chunk_product({})
    assert chunks == []
