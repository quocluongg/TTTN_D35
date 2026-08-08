"""
Chunk Orchestrator: Điều phối chunking dữ liệu sản phẩm thành các Chunk.
Hỗ trợ 4 loại chunk: spec, description, faq, policy
"""
from typing import List
from data_pipeline.chunking.chunk_schema import Chunk


def _format_price(price: int | float) -> str:
    """Format price to Vietnamese format: 42.990.000₫"""
    try:
        price_int = int(price)
        formatted = f"{price_int:,}".replace(",", ".")
        return f"{formatted}₫"
    except (ValueError, TypeError):
        return "Liên hệ"


def _build_spec_text(product: dict) -> str:
    """Build specification chunk text."""
    name = product.get("name", "")
    brand = product.get("brand", "")
    specs = product.get("specifications", {})
    price = product.get("price", 0)

    parts = [f"{brand} {name}"]

    if specs:
        spec_parts = [f"{k}: {v}" for k, v in specs.items()]
        parts.append(" | ".join(spec_parts))

    if price:
        parts.append(f"Giá: {_format_price(price)}")

    return " | ".join(parts)


def _build_description_text(product: dict) -> str:
    """Build description chunk text."""
    name = product.get("name", "")
    brand = product.get("brand", "")
    description = product.get("description", "")
    category = product.get("category", "")
    use_case = product.get("use_case", "")

    parts = [f"{brand} {name}"]

    if category:
        parts.append(f"Danh mục: {category}")
    if use_case:
        parts.append(f"Phù hợp cho: {use_case}")
    if description:
        parts.append(description)

    return ". ".join(parts)


def _build_faq_text(product: dict) -> str:
    """Build FAQ chunk text."""
    name = product.get("name", "")
    faqs = product.get("faqs", [])

    if not faqs:
        return f"Sản phẩm {name} - Vui lòng liên hệ để được tư vấn chi tiết."

    parts = [f"Câu hỏi thường gặp về {name}:"]
    for faq in faqs:
        q = faq.get("question", "")
        a = faq.get("answer", "")
        if q and a:
            parts.append(f"Q: {q}")
            parts.append(f"A: {a}")

    return "\n".join(parts)


def _build_policy_text(product: dict) -> str:
    """Build policy chunk text."""
    name = product.get("name", "")
    brand = product.get("brand", "")
    warranty = product.get("warranty", "")
    promotions = product.get("promotions", "")

    parts = [f"Chính sách sản phẩm {brand} {name}:"]

    if warranty:
        parts.append(f"Bảo hành: {warranty}")
    else:
        parts.append("Bảo hành: Theo chính sách nhà sản xuất")

    if promotions:
        parts.append(f"Khuyến mãi: {promotions}")

    parts.append("Đổi trả: Trong 7 ngày nếu lỗi nhà sản xuất")
    parts.append("Vận chuyển: Miễn phí toàn quốc")

    return "\n".join(parts)


def chunk_product(product: dict) -> List[Chunk]:
    """
    Phân tách sản phẩm thành danh sách Chunk.

    Args:
        product: dict containing product data from database

    Returns:
        List[Chunk]: 4 chunks (spec, description, faq, policy)
    """
    product_id = str(product.get("id", ""))

    if not product_id or not product.get("name"):
        return []

    chunks: List[Chunk] = []

    base_metadata = {
        "product_name": product.get("name", ""),
        "brand": product.get("brand", ""),
        "category": product.get("category", ""),
        "price": product.get("price", 0),
    }

    # 1. Spec Chunk
    spec_text = _build_spec_text(product)
    chunks.append(
        Chunk(
            id=f"{product_id}_spec_0",
            text=spec_text,
            product_id=product_id,
            chunk_type="spec",
            metadata={**base_metadata, "chunk_type": "spec"},
        )
    )

    # 2. Description Chunk
    desc_text = _build_description_text(product)
    chunks.append(
        Chunk(
            id=f"{product_id}_description_0",
            text=desc_text,
            product_id=product_id,
            chunk_type="description",
            metadata={**base_metadata, "chunk_type": "description"},
        )
    )

    # 3. FAQ Chunk
    faq_text = _build_faq_text(product)
    chunks.append(
        Chunk(
            id=f"{product_id}_faq_0",
            text=faq_text,
            product_id=product_id,
            chunk_type="faq",
            metadata={**base_metadata, "chunk_type": "faq"},
        )
    )

    # 4. Policy Chunk
    policy_text = _build_policy_text(product)
    chunks.append(
        Chunk(
            id=f"{product_id}_policy_0",
            text=policy_text,
            product_id=product_id,
            chunk_type="policy",
            metadata={**base_metadata, "chunk_type": "policy"},
        )
    )

    return chunks
