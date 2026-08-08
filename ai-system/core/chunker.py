"""Smart chunking for product data."""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Chunk:
    """Represents a chunk of product data."""
    id: str
    text: str
    product_id: str
    chunk_type: str  # spec, description, faq, policy
    metadata: dict[str, Any] = field(default_factory=dict)
    embedding: list[float] | None = None


def _format_price(price: float) -> str:
    """Format price to Vietnamese: 42.990.000₫"""
    try:
        return f"{int(price):,}".replace(",", ".") + "₫"
    except:
        return "Liên hệ"


def chunk_product(product: dict) -> list[Chunk]:
    """Split product into 4 chunk types."""
    pid = str(product.get("id", ""))
    if not pid or not product.get("name"):
        return []

    name = product.get("name", "")
    brand = product.get("brand", "")
    category = product.get("category", "")
    price = product.get("price", 0)
    description = product.get("description", "")
    specs = product.get("specifications", {})
    use_case = product.get("use_case", "")

    base_meta = {
        "product_name": name,
        "brand": brand,
        "category": category,
        "price": price,
    }

    chunks = []

    # 1. Spec chunk - Thông số kỹ thuật
    spec_parts = [f"{brand} {name}"]
    if specs:
        spec_parts.append(" | ".join(f"{k}: {v}" for k, v in specs.items()))
    if price:
        spec_parts.append(f"Giá: {_format_price(price)}")

    chunks.append(Chunk(
        id=f"{pid}_spec_0",
        text=" | ".join(spec_parts),
        product_id=pid,
        chunk_type="spec",
        metadata={**base_meta, "chunk_type": "spec"},
    ))

    # 2. Description chunk - Mô tả sản phẩm
    desc_parts = [f"{brand} {name}"]
    if category:
        desc_parts.append(f"Danh mục: {category}")
    if use_case:
        desc_parts.append(f"Phù hợp cho: {use_case}")
    if description:
        # Truncate description to avoid too long chunks
        desc_text = description[:500] + "..." if len(description) > 500 else description
        desc_parts.append(desc_text)

    chunks.append(Chunk(
        id=f"{pid}_description_0",
        text=". ".join(desc_parts),
        product_id=pid,
        chunk_type="description",
        metadata={**base_meta, "chunk_type": "description"},
    ))

    # 3. FAQ chunk - Câu hỏi thường gặp
    chunks.append(Chunk(
        id=f"{pid}_faq_0",
        text=f"Sản phẩm {brand} {name} - Vui lòng liên hệ để được tư vấn chi tiết.",
        product_id=pid,
        chunk_type="faq",
        metadata={**base_meta, "chunk_type": "faq"},
    ))

    # 4. Policy chunk - Chính sách
    policy_parts = [f"Chính sách sản phẩm {brand} {name}:"]
    policy_parts.append("Bảo hành: Theo chính sách nhà sản xuất")
    policy_parts.append("Đổi trả: Trong 7 ngày nếu lỗi nhà sản xuất")
    policy_parts.append("Vận chuyển: Miễn phí toàn quốc")

    chunks.append(Chunk(
        id=f"{pid}_policy_0",
        text="\n".join(policy_parts),
        product_id=pid,
        chunk_type="policy",
        metadata={**base_meta, "chunk_type": "policy"},
    ))

    return chunks
