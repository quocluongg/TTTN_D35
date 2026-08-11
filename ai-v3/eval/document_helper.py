"""Helper functions for preparing documents for RAGAS TestsetGen."""
import sys
import os
import json
from typing import List, Dict, Any, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def product_to_document(product: dict) -> str:
    """Convert product dict to text document for RAGAS TestsetGen.

    Args:
        product: Product dictionary from database

    Returns:
        Formatted text document string
    """
    # Handle specifications - could be dict or string
    specs = product.get("specs", "")
    if not specs:
        specifications = product.get("specifications", {})
        if isinstance(specifications, dict):
            specs = ", ".join(f"{k}: {v}" for k, v in specifications.items())
        elif isinstance(specifications, str):
            try:
                specs_dict = json.loads(specifications)
                specs = ", ".join(f"{k}: {v}" for k, v in specs_dict.items())
            except Exception:
                specs = specifications

    price = product.get("price", 0)
    price_str = f"{price:,.0f}" if isinstance(price, (int, float)) and price > 0 else "Liên hệ"

    parts = [
        f"Tên sản phẩm: {product.get('name', 'N/A')}",
        f"Hãng: {product.get('brand', 'N/A')}",
        f"Danh mục: {product.get('category', 'N/A')}",
        f"Giá: {price_str} VNĐ",
        f"Đánh giá: {product.get('rating', 'N/A')}/5.0",
        f"Thông số: {specs}",
        f"Mô tả: {product.get('description', '')}",
    ]

    return "\n".join(parts)


def load_products(products: Optional[List[Dict]] = None) -> List[Dict[str, Any]]:
    """Load products from database or use provided list.

    Args:
        products: Optional list of products. If None, loads from DB.

    Returns:
        List of product dictionaries
    """
    if products is not None:
        return products

    try:
        from core.db import fetch_all_products
        products = fetch_all_products()
        if products:
            print(f"[DocumentHelper] Loaded {len(products)} products from database.")
            return products
    except Exception as e:
        print(f"[DocumentHelper] DB load failed: {e}")

    return []


def products_to_documents(products: List[Dict[str, Any]]) -> List[str]:
    """Convert list of products to list of document strings.

    Args:
        products: List of product dictionaries

    Returns:
        List of formatted document strings
    """
    return [product_to_document(p) for p in products]
