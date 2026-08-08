"""
Unit test cho Response Validator (Faithfulness & Numerical consistency).
"""
# pyrefly: ignore [missing-import]
import pytest
from retrieval.hybrid_retriever import RetrievedDocument
from generation.response_validator import validate_response


def test_validation_valid_response():
    docs = [
        RetrievedDocument(
            id="1",
            text="Laptop HP Omnibook 5 có RAM 16GB, SSD 512GB và giá 25.490.000đ.",
            metadata={"product_name": "HP Omnibook 5"},
        )
    ]

    response = "Laptop HP Omnibook 5 trang bị RAM 16GB, SSD 512GB với mức giá là 25.490.000đ."
    result = validate_response(response, docs)
    assert result.is_valid is True
    assert result.numerical_consistency is True


def test_validation_hallucinated_number():
    docs = [
        RetrievedDocument(
            id="1",
            text="Laptop HP Omnibook 5 có giá 25.490.000đ.",
            metadata={"product_name": "HP Omnibook 5"},
        )
    ]

    # Giá trong response là 99.000.000đ (bịa đặt)
    response = "Laptop HP Omnibook 5 có mức giá ưu đãi là 99.000.000đ."
    result = validate_response(response, docs)
    assert result.is_valid is False
    assert result.numerical_consistency is False
    assert len(result.issues) > 0
