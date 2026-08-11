"""Chunk management endpoints."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from db.supabase_client import get_connection, get_chunk_stats

router = APIRouter(prefix="/admin/chunks", tags=["admin-chunks"])


@router.get("")
async def list_chunks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    chunk_type: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    """List chunks with pagination and filters."""
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Build query with filters
        conditions = []
        params = []

        if chunk_type:
            conditions.append("chunk_type = %s")
            params.append(chunk_type)
        if category:
            conditions.append("category ILIKE %s")
            params.append(f"%{category}%")
        if search:
            conditions.append("chunk_text ILIKE %s")
            params.append(f"%{search}%")

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

        # Count total
        cur.execute(f"SELECT COUNT(*) FROM product_chunks {where_clause}", params)
        total = cur.fetchone()[0]

        # Fetch page
        offset = (page - 1) * page_size
        cur.execute(f"""
            SELECT id, product_id, product_name, chunk_type,
                   LEFT(chunk_text, 150) as text_preview,
                   COALESCE(category, '') as category,
                   COALESCE(price, 0) as price
            FROM product_chunks
            {where_clause}
            ORDER BY product_name
            LIMIT %s OFFSET %s
        """, params + [page_size, offset])

        chunks = []
        for row in cur.fetchall():
            chunks.append({
                "id": row[0],
                "product_id": str(row[1]),
                "product_name": row[2] or "",
                "chunk_type": row[3] or "",
                "text_preview": row[4] or "",
                "category": row[5] or "",
                "price": float(row[6]) if row[6] else 0,
            })

        cur.close()
        conn.close()

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
            "chunks": chunks,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{chunk_id}")
async def delete_chunk(chunk_id: str):
    """Delete a specific chunk."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM product_chunks WHERE id = %s", (chunk_id,))
        deleted = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()

        if deleted == 0:
            raise HTTPException(status_code=404, detail="Chunk not found")

        return {"status": "deleted", "chunk_id": chunk_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rebuild")
async def rebuild_index():
    """Rebuild all chunks and embeddings from Supabase products."""
    from db.supabase_client import fetch_all_products, save_chunks_to_supabase, delete_chunks_by_product
    from admin.logs import log_sync
    import time

    products = fetch_all_products()
    if not products:
        raise HTTPException(status_code=400, detail="No products found")

    start = time.time()

    try:
        # Import chunking logic
        from core.embeddings import PGVectorSearcher
        searcher = PGVectorSearcher(products)

        total_chunks = 0
        for p in products:
            pid = str(p.get("id", ""))
            name = p.get("name", "")

            # Delete old chunks
            delete_chunks_by_product(pid)

            # Generate new chunks (product-level for now)
            chunk_text = f"Sản phẩm: {name}. Danh mục: {p.get('category', '')}. Mô tả: {p.get('description', '')}"
            embedding = searcher.encode_query(chunk_text)

            chunk = {
                "id": f"{pid}_product",
                "product_id": pid,
                "chunk_type": "product",
                "text": chunk_text,
                "embedding": embedding,
                "metadata": {
                    "product_name": name,
                    "category": p.get("category", ""),
                    "price": p.get("price", 0),
                },
            }
            save_chunks_to_supabase([chunk])
            total_chunks += 1

        duration_ms = int((time.time() - start) * 1000)

        log_sync(
            product_id="ALL",
            product_name=f"{len(products)} products",
            action="rebuild",
            chunks=total_chunks,
            status="success",
            duration_ms=duration_ms,
        )

        return {
            "status": "rebuilt",
            "products": len(products),
            "chunks_created": total_chunks,
            "duration_ms": duration_ms,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rebuild failed: {str(e)}")


@router.get("/stats")
async def chunk_stats():
    """Get chunk statistics."""
    return get_chunk_stats()


@router.get("/product/{product_id}")
async def get_product_chunks(product_id: str):
    """Get chunks for a specific product."""
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, chunk_type, LEFT(chunk_text, 300) as text_preview,
                   LENGTH(chunk_text) as text_length
            FROM product_chunks
            WHERE product_id = %s
            ORDER BY chunk_type
        """, (product_id,))

        chunks = []
        for row in cur.fetchall():
            chunks.append({
                "id": row[0],
                "chunk_type": row[1] or "",
                "text_preview": row[2] or "",
                "text_length": row[3] or 0,
            })

        cur.close()
        conn.close()

        return {
            "product_id": product_id,
            "total_chunks": len(chunks),
            "chunks": chunks,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
