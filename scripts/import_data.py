"""
ETL Script: Import product data & RAG chunks vào Supabase
=========================================================
Usage:
    pip install supabase python-dotenv
    python scripts/import_data.py
"""

import json
import os
import re
import sys
import time
from pathlib import Path

# --- Cài đặt đường dẫn ---
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
PROCESSED_DIR = DATA_DIR / "processed"

# --- Supabase credentials ---
SUPABASE_URL = "https://zzukpubwbntihzztilqy.supabase.co"
# Sử dụng service_role key để bypass RLS khi import
# Thay SERVICE_ROLE_KEY bằng key thực từ Supabase Dashboard > Settings > API
SERVICE_ROLE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    "YOUR_SERVICE_ROLE_KEY_HERE"
)

def get_client():
    try:
        from supabase import create_client, Client
        client: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
        return client
    except ImportError:
        print("ERROR: Chưa cài supabase. Chạy: pip install supabase")
        sys.exit(1)

# ---------------------------------------------------------------
# Helper: tạo slug an toàn từ tên sản phẩm
# ---------------------------------------------------------------
def make_slug(name: str, uid: str) -> str:
    slug = name.lower()
    # Xoá dấu cơ bản (tiếng Việt vẫn giữ ký tự gốc → dùng uid làm suffix)
    slug = re.sub(r"[^\w\s-]", "", slug, flags=re.UNICODE)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = slug.strip("-")[:60]
    return f"{slug}-{uid[:8]}" if slug else f"product-{uid[:8]}"

# ---------------------------------------------------------------
# 1. Import sản phẩm từ documents.json
# ---------------------------------------------------------------
def import_products(client):
    docs_file = PROCESSED_DIR / "documents.json"
    if not docs_file.exists():
        print(f"[SKIP] Không tìm thấy {docs_file}")
        return {}

    with open(docs_file, "r", encoding="utf-8") as f:
        documents = json.load(f)

    print(f"[INFO] Đang import {len(documents)} sản phẩm...")
    product_id_map = {}  # doc_id -> db_id
    batch = []

    for doc in documents:
        doc_id   = doc.get("id", "")
        name     = doc.get("name", "Unnamed") or "Unnamed"
        url      = doc.get("url", "")
        price    = doc.get("metadata", {}).get("price")
        doc_text = doc.get("document", "")

        slug = make_slug(name, doc_id)

        product_row = {
            "name":        name,
            "description": doc_text[:5000] if doc_text else None,
            "source_url":  url,
            "slug":        slug,
        }
        batch.append((doc_id, product_row))

    # Upsert theo slug để idempotent
    inserted = 0
    for doc_id, row in batch:
        try:
            res = client.table("product").upsert(row, on_conflict="slug").execute()
            if res.data:
                db_id = res.data[0]["id"]
                product_id_map[doc_id] = db_id
                inserted += 1
        except Exception as e:
            print(f"  [WARN] Bỏ qua {row['slug']}: {e}")

        # Tránh rate-limit
        if inserted % 10 == 0:
            time.sleep(0.1)

    print(f"[OK] Đã import {inserted}/{len(batch)} sản phẩm.")
    return product_id_map

# ---------------------------------------------------------------
# 2. Import ProductVariant (giá từ metadata)
# ---------------------------------------------------------------
def import_variants(client, product_id_map: dict):
    docs_file = PROCESSED_DIR / "documents.json"
    if not docs_file.exists():
        return

    with open(docs_file, "r", encoding="utf-8") as f:
        documents = json.load(f)

    inserted = 0
    for doc in documents:
        doc_id = doc.get("id", "")
        price  = doc.get("metadata", {}).get("price")
        db_id  = product_id_map.get(doc_id)

        if db_id is None or price is None:
            continue

        variant_row = {
            "product_id": db_id,
            "price":      float(price),
            "stock":      0,
        }
        try:
            client.table("product_variant").insert(variant_row).execute()
            inserted += 1
        except Exception as e:
            print(f"  [WARN] Variant: {e}")

        if inserted % 10 == 0:
            time.sleep(0.05)

    print(f"[OK] Đã import {inserted} product_variant.")

# ---------------------------------------------------------------
# 3. Import ProductChunk từ chunks_text.jsonl
# ---------------------------------------------------------------
def import_chunks(client, product_id_map: dict):
    chunks_file = PROCESSED_DIR / "chunks_text.jsonl"
    if not chunks_file.exists():
        print(f"[SKIP] Không tìm thấy {chunks_file}")
        return

    lines = chunks_file.read_text(encoding="utf-8").splitlines()
    print(f"[INFO] Đang import {len(lines)} chunks...")

    inserted = 0
    batch_rows = []
    BATCH_SIZE = 50

    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            chunk = json.loads(line)
        except json.JSONDecodeError:
            continue

        chunk_id   = chunk.get("id", "")
        content    = chunk.get("text", chunk.get("content", ""))
        source_url = chunk.get("url", chunk.get("source_url", ""))

        # Tìm product_id qua doc_id (format: <doc_id>_chunk_<n>)
        doc_id  = chunk_id.split("_chunk_")[0] if "_chunk_" in chunk_id else chunk_id
        db_pid  = product_id_map.get(doc_id)

        row = {
            "id":         chunk_id,
            "product_id": db_pid,
            "content":    content[:10000] if content else "",
            "source_url": source_url,
            "chunk_type": "text",
        }
        batch_rows.append(row)

        if len(batch_rows) >= BATCH_SIZE:
            _flush_chunks(client, batch_rows)
            inserted += len(batch_rows)
            batch_rows = []
            time.sleep(0.1)

    if batch_rows:
        _flush_chunks(client, batch_rows)
        inserted += len(batch_rows)

    print(f"[OK] Đã import {inserted} chunks.")

def _flush_chunks(client, rows):
    try:
        client.table("product_chunk").upsert(rows, on_conflict="id").execute()
    except Exception as e:
        print(f"  [WARN] Flush chunks: {e}")
        # Thử từng row
        for r in rows:
            try:
                client.table("product_chunk").upsert(r, on_conflict="id").execute()
            except Exception as e2:
                print(f"    [SKIP] chunk {r['id']}: {e2}")

# ---------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------
def main():
    if "YOUR_SERVICE_ROLE_KEY_HERE" in SERVICE_ROLE_KEY:
        print(
            "\n[ERROR] Bạn cần set SUPABASE_SERVICE_ROLE_KEY.\n"
            "Lấy key tại: Supabase Dashboard > Settings > API > service_role key\n"
            "Cách set (PowerShell):\n"
            '  $env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."\n'
            "  python scripts/import_data.py\n"
        )
        sys.exit(1)

    client = get_client()
    print("=== ETL Import bắt đầu ===")

    product_map = import_products(client)
    import_variants(client, product_map)
    import_chunks(client, product_map)

    print("\n=== ETL Import hoàn tất! ===")
    print(f"  - Products  : {len(product_map)}")

if __name__ == "__main__":
    main()
