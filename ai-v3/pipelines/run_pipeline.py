import sys
import os
import logging
import time

# Enforce sys.path to include ai-engine directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipelines.ingest_bronze import ingest_bronze_layer
from pipelines.clean_silver import clean_silver_layer
from pipelines.build_platinum_index import build_platinum_layer

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def run_full_pipeline():
    start_time = time.time()
    logging.info("=" * 60)
    logging.info("🚀 KHỞI CHẠY HỆ THỐNG DATA PIPELINE (BRONZE ➔ SILVER ➔ PLATINUM)")
    logging.info("=" * 60)
    
    # 1. Bronze Layer
    logging.info("\n--- STEP 1: BRONZE LAYER (RAW INGESTION) ---")
    bronze_data = ingest_bronze_layer()
    
    # 2. Silver Layer
    logging.info("\n--- STEP 2: SILVER LAYER (CLEANING & STANDARDIZING) ---")
    silver_data = clean_silver_layer()
    
    # 3. Platinum Layer
    logging.info("\n--- STEP 3: PLATINUM LAYER (STRUCTURED CHUNKING & HYBRID INDEXING) ---")
    platinum_data = build_platinum_layer()
    
    elapsed = round(time.time() - start_time, 2)
    logging.info("=" * 60)
    logging.info(f"🎉 HOÀN THÀNH TOÀN BỘ DATA PIPELINE TRONG {elapsed} GIÂY!")
    logging.info(f"📊 Tổng sản phẩm: {silver_data['metadata']['total_records']} | Tổng Chunks Indexed: {platinum_data['metadata']['total_chunks']}")
    logging.info(f"🧠 Vector Model: {platinum_data['metadata']['model_name']} ({platinum_data['metadata']['vector_dimension']}-D)")
    logging.info("=" * 60)

if __name__ == "__main__":
    run_full_pipeline()
