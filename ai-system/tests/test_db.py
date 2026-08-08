import pytest
import sys
import os

# Thêm ai-system vào sys.path để import các module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.db import get_db_connection, fetch_all_products


def test_db_connection():
    """Kiểm tra kết nối trực tiếp tới Supabase Database"""
    conn = get_db_connection()
    assert conn is not None
    cur = conn.cursor()
    cur.execute("SELECT 1;")
    result = cur.fetchone()
    assert result[0] == 1
    cur.close()
    conn.close()

def test_fetch_all_products():
    """Kiểm tra lấy danh sách sản phẩm từ DB"""
    products = fetch_all_products()
    assert isinstance(products, list)
    assert len(products) > 0

    sample = products[0]
    required_keys = ["id", "name", "price", "category", "specifications", "is_active"]
    for key in required_keys:
        assert key in sample, f"Thiếu key '{key}' trong dữ liệu sản phẩm"

    assert isinstance(sample["price"], float)
    assert isinstance(sample["specifications"], dict)
