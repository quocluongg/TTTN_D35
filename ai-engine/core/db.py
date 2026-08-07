import sys
import os
import json
import psycopg2

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres.zzukpubwbntihzztilqy")
DB_PASSWORD = os.getenv("DB_PASSWORD", "agW24oOesftDhJkA")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SILVER_PATH = os.path.join(BASE_DIR, "data", "processed", "products_silver.json")

def get_db_connection():
    """Tạo kết nối tới Supabase PostgreSQL"""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        connect_timeout=10
    )

def fetch_all_products():
    """Lấy danh sách toàn bộ sản phẩm cùng thông số kỹ thuật từ Supabase Postgres hoặc Fallback Silver JSON"""
    try:
        conn = get_db_connection()
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
            WHERE p.is_active IS NOT FALSE;
        """)
        products = cur.fetchall()
        
        product_dict_list = []
        for p in products:
            item = dict(p)
            item['price'] = float(item['price']) if item['price'] is not None else 0.0
            item['original_price'] = item['price'] * 1.15
            item['rating'] = float(item['rating']) if item['rating'] is not None else 4.8
            item['reviews_count'] = int(item['reviews_count']) if item['reviews_count'] is not None else 20
            item['sold_quantity'] = int(item['sold_quantity']) if item['sold_quantity'] is not None else 0
            item['use_case'] = item.get('use_case') or ('Gaming' if 'gaming' in (item.get('category') or '').lower() or 'rtx' in str(item.get('specifications') or '').lower() else 'Văn phòng')
            
            # Đảm bảo specifications dạng dict
            if isinstance(item.get('specifications'), str):
                try:
                    item['specifications'] = json.loads(item['specifications'])
                except Exception:
                    item['specifications'] = {}
            elif not item.get('specifications'):
                item['specifications'] = {}

            product_dict_list.append(item)
            
        cur.close()
        conn.close()
        
        if product_dict_list:
            print(f"[DB] Loaded {len(product_dict_list)} products from Supabase Database.")
            return product_dict_list

    except Exception as e:
        print(f"[DB] Supabase DB fetch error ({e}), falling back to Silver JSON: {SILVER_PATH}")

    # Fallback to Silver JSON if DB query fails or returns empty
    if os.path.exists(SILVER_PATH):
        with open(SILVER_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            records = data.get('records', [])
            for r in records:
                r['image_url'] = r.get('images', [None])[0]
                r['rating'] = 4.8
                r['reviews_count'] = 25
                r['use_case'] = 'Gaming' if 'gaming' in (r.get('category') or '').lower() or 'rtx' in str(r.get('specifications') or '').lower() else 'Văn phòng'
            print(f"[DB] Loaded {len(records)} products from Silver JSON.")
            return records

    return []
