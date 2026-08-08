"""
Unit test cho Prompt Builder.
"""
# pyrefly: ignore [missing-import]
import pytest
from retrieval.hybrid_retriever import RetrievedDocument
from generation.prompt_builder import build_prompt


def test_build_prompt_multi_product():
    docs = [
        RetrievedDocument(
            id="1",
            text="Laptop Asus ROG Strix có RAM 16GB, RTX 4060 giá 30 triệu.",
            metadata={"product_name": "Asus ROG Strix"},
        ),
        RetrievedDocument(
            id="2",
            text="Laptop Dell XPS 13 có RAM 16GB, Intel Core i7 giá 35 triệu.",
            metadata={"product_name": "Dell XPS 13"},
        ),
    ]

    prompt = build_prompt("So sánh Asus ROG và Dell XPS", docs)
    assert "CONTEXT - Asus ROG Strix:" in prompt
    assert "CONTEXT - Dell XPS 13:" in prompt
    assert "CÂU HỎI CỦA KHÁCH HÀNG: So sánh Asus ROG và Dell XPS" in prompt
