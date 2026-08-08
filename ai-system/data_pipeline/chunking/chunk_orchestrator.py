"""
Chunk Orchestrator: Điều phối chunking dữ liệu sản phẩm thành các Chunk.
"""
from typing import List
from data_pipeline.chunking.chunk_schema import Chunk


def chunk_product(product: dict) -> List[Chunk]:
    """Phân tách sản phẩm thành danh sách Chunk."""
    product_id = str(product.get("id", ""))
    chunks: List[Chunk] = []

    # 1. Description Chunk
    desc = product.get("description", "")
    if desc:
        chunks.append(
            Chunk(
                id=f"{product_id}_desc",
                text=desc,
                product_id=product_id,
                chunk_type="description",
                metadata={"product_name": product.get("name", ""), "brand": product.get("brand", "")},
            )
        )

    # 2. Spec Chunk
    specs = product.get("specs", {})
    if specs:
        spec_text = "Thông số kỹ thuật:\n" + "\n".join([f"- {k}: {v}" for k, v in specs.items()])
        chunks.append(
            Chunk(
                id=f"{product_id}_spec",
                text=spec_text,
                product_id=product_id,
                chunk_type="spec",
                metadata={"product_name": product.get("name", ""), "brand": product.get("brand", "")},
            )
        )

    return chunks
