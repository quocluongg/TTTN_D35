"""Tests for document helper functions."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from eval.document_helper import product_to_document, load_products


def test_product_to_document_basic():
    """Test basic product to document conversion."""
    product = {
        "name": "Laptop ASUS ROG Strix G16",
        "brand": "ASUS",
        "category": "Laptop Gaming",
        "price": 42990000,
        "rating": 4.8,
        "specs": "RAM 32GB SSD 1TB RTX 4070",
        "description": "Laptop gaming cao cấp"
    }

    doc = product_to_document(product)

    assert "Laptop ASUS ROG Strix G16" in doc
    assert "ASUS" in doc
    assert "Laptop Gaming" in doc
    assert "42,990,000" in doc
    assert "RAM 32GB SSD 1TB RTX 4070" in doc


def test_product_to_document_missing_fields():
    """Test conversion with missing optional fields."""
    product = {
        "name": "Test Product",
        "brand": "Test",
        "category": "Test",
        "price": 1000000
    }

    doc = product_to_document(product)

    assert "Test Product" in doc
    assert "1,000,000" in doc
    assert "N/A" in doc  # rating missing


def test_product_to_document_with_specifications():
    """Test conversion with specifications dict."""
    product = {
        "name": "Test Laptop",
        "brand": "Test",
        "category": "Laptop",
        "price": 20000000,
        "rating": 4.5,
        "specifications": {"RAM": "16GB", "SSD": "512GB"}
    }

    doc = product_to_document(product)

    assert "16GB" in doc
    assert "512GB" in doc


def test_load_products_from_list():
    """Test loading products from a list."""
    products = [
        {"name": "P1", "brand": "A", "category": "C1", "price": 100},
        {"name": "P2", "brand": "B", "category": "C2", "price": 200}
    ]

    result = load_products(products=products)

    assert len(result) == 2
    assert result[0]["name"] == "P1"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
