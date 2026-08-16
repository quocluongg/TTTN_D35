import os
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "all_products.json")
BRONZE_OUTPUT_PATH = os.path.join(BASE_DIR, "data", "raw", "products_bronze.json")

def ingest_bronze_layer(raw_source_path: str = RAW_DATA_PATH, output_path: str = BRONZE_OUTPUT_PATH):
    """
    Bronze Layer Ingestion:
    Đọc dữ liệu thô từ các nguồn (Crawler/File/Database), gắn metadata ingestion 
    và lưu trữ bảo toàn dữ liệu gốc (as-is) tại Bronze Layer.
    """
    logging.info(f"🚀 [BRONZE LAYER] Bắt đầu nạp dữ liệu thô từ {raw_source_path}")
    
    if not os.path.exists(raw_source_path):
        raise FileNotFoundError(f"Không tìm thấy file dữ liệu thô tại: {raw_source_path}")
        
    with open(raw_source_path, "r", encoding="utf-8") as f:
        raw_items = json.load(f)
        
    logging.info(f"📦 Đã đọc {len(raw_items)} sản phẩm thô.")
    
    bronze_data = {
        "metadata": {
            "layer": "BRONZE",
            "source": "crawled_electronics_catalog",
            "ingested_at": datetime.now().isoformat(),
            "total_records": len(raw_items)
        },
        "records": raw_items
    }
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(bronze_data, f, ensure_ascii=False, indent=2)
        
    logging.info(f"✅ [BRONZE LAYER] Đã lưu {len(raw_items)} bản ghi vào {output_path}")
    return bronze_data

if __name__ == "__main__":
    ingest_bronze_layer()
