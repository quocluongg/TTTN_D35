"""Supabase PostgreSQL client for product data."""
import sys
import os
import logging
import json

# Fix Windows encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
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
        connect_timeout=10
    )


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
                COALESCE(c.name, 'Laptop') as category,
                COALESCE(v.price, 0) as price,
                v.attributes as specifications
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants v ON v.product_id = p.id
            WHERE p.is_active = true
        """)

        products = cur.fetchall()

        # Deduplicate by product ID
        seen = set()
        unique = []
        for p in products:
            pid = str(p['id'])
            if pid not in seen:
                seen.add(pid)
                # Normalize
                p['price'] = float(p['price']) if p['price'] else 0.0
                p['rating'] = float(p['rating']) if p['rating'] else 5.0
                p['reviews_count'] = int(p['reviews_count']) if p['reviews_count'] else 0
                p['sold_quantity'] = int(p['sold_quantity']) if p['sold_quantity'] else 0

                # Parse specifications
                specs = p.get('specifications')
                if isinstance(specs, str):
                    try:
                        p['specifications'] = json.loads(specs)
                    except:
                        p['specifications'] = {}
                elif not specs:
                    p['specifications'] = {}

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
                COALESCE(c.name, 'Laptop') as category,
                COALESCE(v.price, 0) as price,
                v.attributes as specifications
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants v ON v.product_id = p.id
            WHERE p.id = %s AND p.is_active = true
        """, (product_id,))

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return None

        # Normalize
        row['price'] = float(row['price']) if row['price'] else 0.0
        specs = row.get('specifications')
        if isinstance(specs, str):
            try:
                row['specifications'] = json.loads(specs)
            except:
                row['specifications'] = {}
        elif not specs:
            row['specifications'] = {}

        return row

    except Exception as e:
        logger.error(f"Failed to fetch product {product_id}: {e}")
        return None
