"""
Script generate SQL import từ raw product data và RAG chunks
"""

import json
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
RAW_PRODUCTS_PATH = BASE_DIR / "data" / "raw" / "all_products.json"
DOCS_PATH = BASE_DIR / "data" / "processed" / "documents.json"
CHUNKS_PATH = BASE_DIR / "data" / "processed" / "chunks_text.jsonl"
OUTPUT_SQL_PATH = BASE_DIR / "scripts" / "data_migration.sql"

def escape_sql_str(val):
    if val is None:
        return "NULL"
    val_str = str(val).replace("'", "''").replace("\\", "\\\\")
    return f"'{val_str}'"

def make_slug(name, uid):
    slug = name.lower()
    slug = re.sub(r"[^\w\s-]", "", slug, flags=re.UNICODE)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = slug.strip("-")[:60]
    return f"{slug}-{uid[:8]}" if slug else f"product-{uid[:8]}"

def generate_sql():
    sql_lines = []
    sql_lines.append("-- Auto-generated Data Migration SQL\n")

    # Load raw products
    with open(RAW_PRODUCTS_PATH, "r", encoding="utf-8") as f:
        products = json.load(f)

    # Dictionary doc_id -> db_product_id (we will insert products and get their ids using CTEs or sequential IDs)
    # Since product.id is BIGSERIAL, we can insert products with explicit IDs 1..100 or use CTEs.
    # Specifying explicit IDs for product makes FK referencing very easy!
    
    product_id_map = {} # doc_id -> int_id

    # 1. Products
    sql_lines.append("-- 1. Insert Products")
    for idx, p in enumerate(products, start=1):
        doc_id = p.get("id", f"p_{idx}")
        product_id_map[doc_id] = idx
        name = p.get("name", "Unnamed") or "Unnamed"
        desc = p.get("description", "") or ""
        url = p.get("url", "") or ""
        slug = make_slug(name, doc_id)
        
        # Get thumbnail if images exist
        images = p.get("images", [])
        thumbnail = images[0] if images else None

        name_sql = escape_sql_str(name)
        desc_sql = escape_sql_str(desc)
        url_sql = escape_sql_str(url)
        slug_sql = escape_sql_str(slug)
        thumb_sql = escape_sql_str(thumbnail)

        sql_lines.append(
            f"INSERT INTO public.product (id, name, description, thumbnail, slug, source_url) "
            f"VALUES ({idx}, {name_sql}, {desc_sql}, {thumb_sql}, {slug_sql}, {url_sql}) "
            f"ON CONFLICT (id) DO UPDATE SET name={name_sql}, description={desc_sql}, thumbnail={thumb_sql}, source_url={url_sql};"
        )

    sql_lines.append("\n-- Reset product sequence")
    sql_lines.append("SELECT setval('public.product_id_seq', (SELECT MAX(id) FROM public.product));\n")

    # 2. Product Images
    sql_lines.append("-- 2. Insert Product Images")
    img_id = 1
    for idx, p in enumerate(products, start=1):
        images = p.get("images", [])
        for sort_order, img_url in enumerate(images):
            if img_url:
                url_sql = escape_sql_str(img_url)
                sql_lines.append(
                    f"INSERT INTO public.product_image (product_id, url, sort_order) VALUES ({idx}, {url_sql}, {sort_order});"
                )
                img_id += 1

    # 3. Product Variants
    sql_lines.append("\n-- 3. Insert Product Variants")
    for idx, p in enumerate(products, start=1):
        variants = p.get("variants", [])
        prices_dict = p.get("prices", {})
        main_price = prices_dict.get("current")

        if variants:
            for v in variants:
                label = v.get("label", "Mặc định")
                v_price = v.get("price") or main_price or 0
                attr_json = json.dumps({"variant_name": label}, ensure_ascii=False)
                attr_sql = escape_sql_str(attr_json)
                v_price_sql = float(v_price) if v_price else 0
                sql_lines.append(
                    f"INSERT INTO public.product_variant (product_id, price, stock, attributes) "
                    f"VALUES ({idx}, {v_price_sql}, 50, {attr_sql}::jsonb);"
                )
        else:
            price_val = main_price or 0
            attr_json = json.dumps({"variant_name": "Mặc định"}, ensure_ascii=False)
            attr_sql = escape_sql_str(attr_json)
            sql_lines.append(
                f"INSERT INTO public.product_variant (product_id, price, stock, attributes) "
                f"VALUES ({idx}, {price_val}, 100, {attr_sql}::jsonb);"
            )

    # 4. Product Specifications
    sql_lines.append("\n-- 4. Insert Product Specifications")
    for idx, p in enumerate(products, start=1):
        specs = p.get("specifications", {})
        if isinstance(specs, dict):
            for key, val in specs.items():
                if key and val:
                    key_sql = escape_sql_str(str(key)[:100])
                    val_sql = escape_sql_str(str(val))
                    sql_lines.append(
                        f"INSERT INTO public.product_specification (product_id, spec_key, spec_value) "
                        f"VALUES ({idx}, {key_sql}, {val_sql});"
                    )

    # 5. Product Chunks (RAG)
    sql_lines.append("\n-- 5. Insert Product Chunks")
    with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                chunk = json.loads(line)
            except json.JSONDecodeError:
                continue

            chunk_id = chunk.get("id", "")
            content = chunk.get("text", "")
            
            # Map chunk back to product_id
            doc_id = chunk_id.split("_c")[0] if "_c" in chunk_id else chunk_id
            db_pid = product_id_map.get(doc_id)
            pid_sql = str(db_pid) if db_pid else "NULL"

            cid_sql = escape_sql_str(chunk_id)
            cnt_sql = escape_sql_str(content)

            sql_lines.append(
                f"INSERT INTO public.product_chunk (id, product_id, content, chunk_type) "
                f"VALUES ({cid_sql}, {pid_sql}, {cnt_sql}, 'text') "
                f"ON CONFLICT (id) DO UPDATE SET content={cnt_sql}, product_id={pid_sql};"
            )

    output_sql = "\n".join(sql_lines)
    OUTPUT_SQL_PATH.write_text(output_sql, encoding="utf-8")
    print(f"[OK] Generated SQL at {OUTPUT_SQL_PATH} ({len(sql_lines)} lines)")

if __name__ == "__main__":
    generate_sql()
