"""Chunk management endpoints."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ai.core.db import get_chunk_stats, get_connection

router = APIRouter(prefix="/admin/chunks", tags=["admin-chunks"])


@router.get("")
async def list_chunks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    chunk_type: Optional[str] = None,
    search: Optional[str] = None,
):
    try:
        conn = get_connection()
        cur = conn.cursor()
        conditions, params = [], []
        if chunk_type:
            conditions.append("chunk_type = %s")
            params.append(chunk_type)
        if search:
            conditions.append("chunk_text ILIKE %s")
            params.append(f"%{search}%")
        where = "WHERE " + " AND ".join(conditions) if conditions else ""

        cur.execute(f"SELECT COUNT(*) FROM product_chunks {where}", params)
        total = cur.fetchone()[0]
        offset = (page - 1) * page_size
        cur.execute(f"""
            SELECT id, product_id, product_name, chunk_type, LEFT(chunk_text, 150) as text_preview,
                   COALESCE(category, '') as category, COALESCE(price, 0) as price
            FROM product_chunks {where} ORDER BY product_name LIMIT %s OFFSET %s
        """, params + [page_size, offset])
        chunks = [
            {"id": r[0], "product_id": str(r[1]), "product_name": r[2] or "",
             "chunk_type": r[3] or "", "text_preview": r[4] or "",
             "category": r[5] or "", "price": float(r[6]) if r[6] else 0}
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return {"total": total, "page": page, "page_size": page_size, "chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def chunk_stats():
    return get_chunk_stats()


@router.get("/product/{product_id}")
async def get_product_chunks(product_id: str):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, chunk_type, LEFT(chunk_text, 300) as text_preview, LENGTH(chunk_text) as len
            FROM product_chunks WHERE product_id = %s ORDER BY chunk_type
        """, (product_id,))
        chunks = [{"id": r[0], "chunk_type": r[1] or "", "text_preview": r[2] or "", "text_length": r[3] or 0} for r in cur.fetchall()]
        cur.close()
        conn.close()
        return {"product_id": product_id, "total_chunks": len(chunks), "chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
