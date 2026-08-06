import os
import re
import json
import logging
from typing import Dict, Any, List
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BRONZE_PATH = os.path.join(BASE_DIR, "data", "raw", "products_bronze.json")
SILVER_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "processed", "products_silver.json")

def clean_html_text(text: str) -> str:
    """Xóa bỏ các thẻ HTML, ký tự rác và khoảng trắng dư thừa"""
    if not text:
        return ""
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', ' ', text)
    # Replace multiple spaces / newlines with single space
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()

def parse_price(price_data: Any) -> float:
    """Chuẩn hóa giá về số float VNĐ"""
    if isinstance(price_data, (int, float)):
        return float(price_data)
    if isinstance(price_data, dict):
        current = price_data.get('current') or price_data.get('price')
        if current is not None:
            return parse_price(current)
    if isinstance(price_data, str):
        # Extract digits
        digits = re.sub(r'[^\d]', '', price_data)
        if digits:
            return float(digits)
    return 0.0

def detect_category(name: str, desc: str) -> str:
    """Tự động phân loại danh mục sản phẩm nếu danh mục gốc bị rỗng"""
    text = f"{name} {desc}".lower()
    if any(k in text for k in ['laptop', 'macbook', 'notebook', 'aspire', 'vivobook', 'thinkpad']):
        return "Laptop"
    elif any(k in text for k in ['iphone', 'samsung galaxy', 'xiaomi', 'oppo', 'masstel', 'điện thoại']):
        return "Điện thoại"
    elif any(k in text for k in ['tai nghe', 'headphone', 'airpods', 'earbuds', 'loa']):
        return "Âm thanh & Tai nghe"
    elif any(k in text for k in ['ốp lưng', 'kính cường lực', 'sạc', 'cáp', 'hub', 'dây đeo']):
        return "Phụ kiện"
    elif any(k in text for k in ['màn hình', 'mainboard', 'vga', 'ram', 'ổ cứng', 'bàn phím', 'chuột']):
        return "Linh kiện & Phụ kiện PC"
    elif any(k in text for k in ['apple watch', 'đồng hồ', 'smartwatch']):
        return "Đồng hồ thông minh"
    elif any(k in text for k in ['robot hút bụi', 'bàn ủi', 'máy giặt', 'cây nước']):
        return "Gia dụng thông minh"
    return "Thiết bị điện tử khác"

def clean_silver_layer(bronze_path: str = BRONZE_PATH, output_path: str = SILVER_OUTPUT_PATH):
    """
    Silver Layer Processing:
    Đọc dữ liệu Bronze, làm sạch text, chuẩn hóa giá, phân loại danh mục, 
    bóc tách thông số kỹ thuật (specs) và loại bỏ bản ghi rác.
    """
    logging.info(f"🚀 [SILVER LAYER] Bắt đầu làm sạch dữ liệu từ {bronze_path}")
    
    if not os.path.exists(bronze_path):
        raise FileNotFoundError(f"Không tìm thấy file Bronze tại: {bronze_path}")
        
    with open(bronze_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        records = data.get("records", [])
        
    cleaned_products: List[Dict[str, Any]] = []
    
    for item in records:
        name = clean_html_text(item.get("name", ""))
        if not name or len(name) < 3:
            continue
            
        desc = clean_html_text(item.get("description", ""))
        meta_desc = clean_html_text(item.get("meta_description", ""))
        full_desc = desc if len(desc) > 20 else meta_desc
        
        # Parse Price
        price = parse_price(item.get("prices"))
        if price == 0.0 and item.get("variants"):
            for v in item.get("variants", []):
                v_price = parse_price(v.get("price"))
                if v_price > 0:
                    price = v_price
                    break

        # Category
        raw_cat = item.get("category")
        category = ""
        if isinstance(raw_cat, list) and raw_cat:
            category = clean_html_text(raw_cat[0])
        elif isinstance(raw_cat, str) and raw_cat:
            category = clean_html_text(raw_cat)
            
        if not category or category.lower() == "chưa phân loại":
            category = detect_category(name, full_desc)

        # Specifications Cleaning
        raw_specs = item.get("specifications", {})
        cleaned_specs = {}
        if isinstance(raw_specs, dict):
            for k, v in raw_specs.items():
                k_clean = clean_html_text(str(k))
                v_clean = clean_html_text(str(v))
                if k_clean and v_clean and v_clean != ",":
                    cleaned_specs[k_clean] = v_clean
                    
        # Extract images & url
        images = item.get("images", [])
        clean_images = [img for img in images if isinstance(img, str) and (img.startswith("http") or img.startswith("/")) and "placehoder" not in img]
        
        silver_record = {
            "id": item.get("id", ""),
            "name": name,
            "category": category,
            "price": price,
            "specifications": cleaned_specs,
            "description": full_desc,
            "url": item.get("url", ""),
            "images": clean_images,
            "updated_at": datetime.now().isoformat()
        }
        cleaned_products.append(silver_record)
        
    logging.info(f"✨ [SILVER LAYER] Đã chuẩn hóa và làm sạch {len(cleaned_products)}/{len(records)} sản phẩm hợp lệ.")
    
    silver_data = {
        "metadata": {
            "layer": "SILVER",
            "cleaned_at": datetime.now().isoformat(),
            "total_records": len(cleaned_products)
        },
        "records": cleaned_products
    }
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(silver_data, f, ensure_ascii=False, indent=2)
        
    logging.info(f"✅ [SILVER LAYER] Đã lưu dữ liệu sạch vào {output_path}")
    return silver_data

if __name__ == "__main__":
    clean_silver_layer()
