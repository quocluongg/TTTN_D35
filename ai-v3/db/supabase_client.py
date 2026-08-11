"""Supabase PostgreSQL client with pgvector support."""
import sys
import os
import logging
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from psycopg2.extras import RealDictCursor
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_connection():
    """Get psycopg2 connection to Supabase."""
    return psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        connect_timeout=10,
    )


# ============ PRODUCT OPERATIONS ============


def fetch_all_products() -> list[dict]:
    """Fetch all active products with variants."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT
                p.id,
                p.name,
                p.slug,
                p.description,
                p.brand,
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
        seen = set()
        unique = []
        for p in products:
            pid = str(p["id"])
            if pid not in seen:
                seen.add(pid)
                p["price"] = float(p["price"]) if p["price"] else 0.0
                p["original_price"] = p["price"] * 1.15
                p["rating"] = float(p["rating"]) if p["rating"] else 5.0
                p["reviews_count"] = int(p["reviews_count"]) if p["reviews_count"] else 0
                p["sold_quantity"] = int(p["sold_quantity"]) if p["sold_quantity"] else 0
                p["stock_quantity"] = int(p["stock_quantity"]) if p["stock_quantity"] else 20
                specs = p.get("specifications")
                if isinstance(specs, str):
                    try:
                        p["specifications"] = json.loads(specs)
                    except Exception:
                        p["specifications"] = {}
                elif not specs:
                    p["specifications"] = {}
                unique.append(p)

        cur.close()
        conn.close()
        logger.info(f"Fetched {len(unique)} unique products from Supabase")
        return unique

    except Exception as e:
        logger.error(f"Failed to fetch products: {e}")
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
                COALESCE(p.is_active, true) as is_active,
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
        logger.error(f"Failed to fetch product {product_id}: {e}")
        return None


# ============ CHUNK OPERATIONS (pgvector) ============


def save_chunks_to_supabase(chunks: list) -> int:
    """Save chunks with embeddings to Supabase product_chunks table."""
    if not chunks:
        return 0

    try:
        conn = get_connection()
        cur = conn.cursor()
        saved = 0

        for chunk in chunks:
            embedding = chunk.get("embedding") if isinstance(chunk, dict) else getattr(chunk, "embedding", None)
            if embedding is None:
                continue

            chunk_id = chunk.get("id") if isinstance(chunk, dict) else getattr(chunk, "id", "")
            product_id = chunk.get("product_id") if isinstance(chunk, dict) else getattr(chunk, "product_id", "")
            chunk_type = chunk.get("chunk_type") if isinstance(chunk, dict) else getattr(chunk, "chunk_type", "")
            text = chunk.get("text") if isinstance(chunk, dict) else getattr(chunk, "text", "")
            metadata = chunk.get("metadata", {}) if isinstance(chunk, dict) else getattr(chunk, "metadata", {})

            embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

            cur.execute("""
                INSERT INTO product_chunks (id, product_id, chunk_type, chunk_text, product_name, category, price, embedding, content)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s::vector, %s)
                ON CONFLICT (id) DO UPDATE SET
                    chunk_text = EXCLUDED.chunk_text,
                    embedding = EXCLUDED.embedding,
                    updated_at = NOW()
            """, (
                chunk_id,
                product_id,
                chunk_type,
                text[:1000],
                metadata.get("product_name", ""),
                metadata.get("category", ""),
                metadata.get("price", 0),
                embedding_str,
                text,
            ))
            saved += 1

        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"Saved {saved} chunks to Supabase")
        return saved

    except Exception as e:
        logger.error(f"Failed to save chunks to Supabase: {e}")
        return 0


def delete_chunks_by_product(product_id: str) -> int:
    """Delete all chunks for a product from Supabase."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM product_chunks WHERE product_id = %s", (product_id,))
        deleted = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"Deleted {deleted} chunks for product {product_id}")
        return deleted
    except Exception as e:
        logger.error(f"Failed to delete chunks: {e}")
        return 0


def search_chunks_pgvector(query_embedding: list, top_k: int = 20) -> list[dict]:
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
        logger.error(f"Failed to search pgvector: {e}")
        return []


def get_chunk_stats() -> dict:
    """Get chunk statistics from Supabase."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("SELECT COUNT(*) as total FROM product_chunks")
        total = cur.fetchone()["total"]

        cur.execute("SELECT COUNT(DISTINCT product_id) as synced FROM product_chunks WHERE embedding IS NOT NULL")
        synced_products = cur.fetchone()["synced"]

        cur.execute("""
            SELECT chunk_type, COUNT(*) as count
            FROM product_chunks
            GROUP BY chunk_type
            ORDER BY count DESC
        """)
        by_type = {row["chunk_type"]: row["count"] for row in cur.fetchall()}

        cur.execute("""
            SELECT category, COUNT(*) as count
            FROM product_chunks
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY count DESC
            LIMIT 10
        """)
        by_category = {row["category"]: row["count"] for row in cur.fetchall()}

        cur.close()
        conn.close()

        return {
            "total_chunks": total,
            "synced_products": synced_products,
            "by_type": by_type,
            "by_category": by_category,
        }

    except Exception as e:
        logger.error(f"Failed to get chunk stats: {e}")
        return {"total_chunks": 0, "synced_products": 0, "by_type": {}, "by_category": {}}


def get_all_chunk_ids_by_product() -> dict[str, list[str]]:
    """Get mapping of product_id -> list of chunk_ids."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, product_id FROM product_chunks")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        mapping: dict[str, list[str]] = {}
        for row in rows:
            pid = str(row["product_id"])
            mapping.setdefault(pid, []).append(row["id"])
        return mapping

    except Exception as e:
        logger.error(f"Failed to get chunk mapping: {e}")
        return {}


def get_chunk_embeddings_by_product_ids(product_ids: list[str]) -> dict[str, list]:
    """Fetch embeddings grouped by product_id for MMR diversification."""
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

        result: dict[str, list] = {}
        for row in rows:
            pid = str(row["product_id"])
            # pgvector returns embedding as a string like "[0.1,0.2,...]"
            emb = row["embedding"]
            if isinstance(emb, str):
                emb = [float(x) for x in emb.strip("[]").split(",")]
            result.setdefault(pid, []).append(emb)
        return result

    except Exception as e:
        logger.error(f"Failed to fetch embeddings: {e}")
        return {}
