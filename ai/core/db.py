"""Supabase PostgreSQL client — single source for DB operations.

Merges v3's core/db.py and db/supabase_client.py into one module.
"""
import json
import logging
import os
import sys

import psycopg2
from psycopg2.extras import RealDictCursor

from ai.config import get_settings

logger = logging.getLogger(__name__)

# Silver JSON fallback path
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_SILVER_PATH = os.path.join(_BASE_DIR, "data", "processed", "products_silver.json")


def get_connection():
    """Get psycopg2 connection to Supabase PostgreSQL."""
    s = get_settings()
    return psycopg2.connect(
        host=s.DB_HOST,
        port=s.DB_PORT,
        dbname=s.DB_NAME,
        user=s.DB_USER,
        password=s.DB_PASSWORD,
        connect_timeout=10,
    )


def fetch_all_products() -> list:
    """Fetch all active products with variants. Falls back to Silver JSON."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT
                p.id, p.name, p.slug, p.description, p.brand,
                p.thumbnail as image_url,
                COALESCE(p.rating_avg, 5.0) as rating,
                COALESCE(p.review_count, 0) as reviews_count,
                COALESCE(p.sold_quantity, 0) as sold_quantity,
                COALESCE(p.use_case, 'Giải trí') as use_case,
                COALESCE(p.is_active, true) as is_active,
                COALESCE(c.name, 'Laptop') as category,
                COALESCE(v.price, 0) as price,
                COALESCE(v.stock, 20) as stock_quantity,
                v.attributes as specifications
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants v ON v.product_id = p.id
            WHERE p.is_active IS NOT FALSE
        """)
        products = cur.fetchall()
        cur.close()
        conn.close()

        result = []
        seen = set()
        for p in products:
            pid = str(p["id"])
            if pid in seen:
                continue
            seen.add(pid)
            item = dict(p)
            item["price"] = float(item["price"]) if item["price"] else 0.0
            item["original_price"] = item["price"] * 1.15
            item["rating"] = float(item["rating"]) if item["rating"] else 5.0
            item["reviews_count"] = int(item["reviews_count"]) if item["reviews_count"] else 0
            item["sold_quantity"] = int(item["sold_quantity"]) if item["sold_quantity"] else 0
            specs = item.get("specifications")
            if isinstance(specs, str):
                try:
                    item["specifications"] = json.loads(specs)
                except Exception:
                    item["specifications"] = {}
            elif not specs:
                item["specifications"] = {}
            result.append(item)

        if result:
            logger.info(f"[DB] Loaded {len(result)} products from Supabase.")
            return result

    except Exception as e:
        logger.warning(f"[DB] Supabase error ({e}), falling back to Silver JSON.")

    # Silver JSON fallback
    if os.path.exists(_SILVER_PATH):
        with open(_SILVER_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            records = data.get("records", [])
            for r in records:
                r["image_url"] = r.get("images", [None])[0]
                r["rating"] = 4.8
                r["reviews_count"] = 25
                r["use_case"] = "Gaming" if "gaming" in (r.get("category") or "").lower() else "Văn phòng"
            logger.info(f"[DB] Loaded {len(records)} products from Silver JSON.")
            return records

    return []


def fetch_product_by_id(product_id: str) -> dict | None:
    """Fetch single product by ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT
                p.id, p.name, p.slug, p.description, p.brand,
                p.thumbnail as image_url,
                COALESCE(p.rating_avg, 5.0) as rating,
                COALESCE(p.use_case, 'Giải trí') as use_case,
                COALESCE(c.name, 'Laptop') as category,
                COALESCE(v.price, 0) as price,
                v.attributes as specifications
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants v ON v.product_id = p.id
            WHERE p.id = %s AND p.is_active IS NOT FALSE
        """, (product_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return None

        row = dict(row)
        row["price"] = float(row["price"]) if row["price"] else 0.0
        specs = row.get("specifications")
        if isinstance(specs, str):
            try:
                row["specifications"] = json.loads(specs)
            except Exception:
                row["specifications"] = {}
        elif not specs:
            row["specifications"] = {}
        return row

    except Exception as e:
        logger.error(f"[DB] Failed to fetch product {product_id}: {e}")
        return None


# ============ CHUNK OPERATIONS (pgvector) ============


def save_chunks(chunks: list) -> int:
    """Save chunks with embeddings to product_chunks table."""
    if not chunks:
        return 0
    try:
        conn = get_connection()
        cur = conn.cursor()
        saved = 0
        for chunk in chunks:
            embedding = chunk.get("embedding")
            if embedding is None:
                continue
            embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
            cur.execute("""
                INSERT INTO product_chunks (id, product_id, chunk_type, chunk_text, product_name, category, price, embedding, content)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s::vector, %s)
                ON CONFLICT (id) DO UPDATE SET
                    chunk_text = EXCLUDED.chunk_text,
                    embedding = EXCLUDED.embedding,
                    updated_at = NOW()
            """, (
                chunk.get("id", ""), chunk.get("product_id", ""), chunk.get("chunk_type", ""),
                chunk.get("text", "")[:1000],
                chunk.get("metadata", {}).get("product_name", ""),
                chunk.get("metadata", {}).get("category", ""),
                chunk.get("metadata", {}).get("price", 0),
                embedding_str, chunk.get("text", ""),
            ))
            saved += 1
        conn.commit()
        cur.close()
        conn.close()
        return saved
    except Exception as e:
        logger.error(f"[DB] Failed to save chunks: {e}")
        return 0


def delete_chunks_by_product(product_id: str) -> int:
    """Delete all chunks for a product."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM product_chunks WHERE product_id = %s", (product_id,))
        deleted = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        return deleted
    except Exception as e:
        logger.error(f"[DB] Failed to delete chunks: {e}")
        return 0


def search_chunks_pgvector(query_embedding: list, top_k: int = 20) -> list:
    """Search chunks using pgvector cosine similarity."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
        cur.execute("""
            SELECT id, product_id, chunk_type, chunk_text, product_name, category, price,
                   1 - (embedding <=> %s::vector) as similarity
            FROM product_chunks
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """, (embedding_str, embedding_str, top_k))
        results = cur.fetchall()
        cur.close()
        conn.close()
        return [dict(r) for r in results]
    except Exception as e:
        logger.error(f"[DB] pgvector search failed: {e}")
        return []


def get_chunk_embeddings_by_product_ids(product_ids: list) -> dict:
    """Fetch embeddings grouped by product_id for MMR."""
    if not product_ids:
        return {}
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT product_id, embedding
            FROM product_chunks
            WHERE product_id = ANY(%s::uuid[]) AND embedding IS NOT NULL
        """, (product_ids,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        result = {}
        for row in rows:
            pid = str(row["product_id"])
            emb = row["embedding"]
            if isinstance(emb, str):
                emb = [float(x) for x in emb.strip("[]").split(",")]
            result.setdefault(pid, []).append(emb)
        return result
    except Exception as e:
        logger.error(f"[DB] Failed to fetch embeddings: {e}")
        return {}


def get_chunk_stats() -> dict:
    """Get chunk statistics."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT COUNT(*) as total FROM product_chunks")
        total = cur.fetchone()["total"]
        cur.execute("SELECT COUNT(DISTINCT product_id) as synced FROM product_chunks WHERE embedding IS NOT NULL")
        synced = cur.fetchone()["synced"]
        cur.execute("SELECT chunk_type, COUNT(*) as count FROM product_chunks GROUP BY chunk_type ORDER BY count DESC")
        by_type = {row["chunk_type"]: row["count"] for row in cur.fetchall()}
        cur.close()
        conn.close()
        return {"total_chunks": total, "synced_products": synced, "by_type": by_type}
    except Exception as e:
        logger.error(f"[DB] Failed to get chunk stats: {e}")
        return {"total_chunks": 0, "synced_products": 0, "by_type": {}}


def get_all_chunk_ids_by_product() -> dict:
    """Get mapping of product_id -> list of chunk_ids."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, product_id FROM product_chunks")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        mapping = {}
        for row in rows:
            pid = str(row["product_id"])
            mapping.setdefault(pid, []).append(row["id"])
        return mapping
    except Exception as e:
        logger.error(f"[DB] Failed to get chunk mapping: {e}")
        return {}
