import os
import json
import pickle
import logging
import numpy as np
import faiss
from typing import List, Dict, Any
from datetime import datetime
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SILVER_PATH = os.path.join(BASE_DIR, "data", "processed", "products_silver.json")

FAISS_INDEX_PATH = os.path.join(BASE_DIR, "data", "processed", "faiss_index.bin")
BM25_INDEX_PATH = os.path.join(BASE_DIR, "data", "processed", "bm25_index.pkl")
METADATA_PATH = os.path.join(BASE_DIR, "data", "processed", "chunks_metadata.json")

# Model Embedding BGE-M3 (Fallback sang multilingual-MiniLM nếu cần)
PRIMARY_MODEL = "BAAI/bge-m3"
FALLBACK_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

def tokenize_vietnamese(text: str) -> List[str]:
    import re
    if not text:
        return []
    return re.findall(r'\w+', text.lower())

def create_structured_chunks(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Structured Chunking theo cấu trúc sản phẩm điện tử:
    - Spec Chunk: Thông số kỹ thuật chi tiết
    - Desc Chunk: Mô tả & điểm nổi bật
    - FAQ Policy Chunk: Chính sách bảo hành, khuyến mãi & đối tượng phù hợp
    """
    chunks = []
    
    for p in products:
        p_id = p.get("id", "")
        name = p.get("name", "")
        cat = p.get("category", "")
        price = p.get("price", 0.0)
        formatted_price = f"{int(price):,} VNĐ" if price > 0 else "Liên hệ"
        specs = p.get("specifications", {})
        desc = p.get("description", "")

        # 1. Spec Chunk (Thông số kỹ thuật)
        specs_text_list = [f"{k}: {v}" for k, v in specs.items()]
        specs_str = "; ".join(specs_text_list) if specs_text_list else "Đang cập nhật thông số"
        
        spec_chunk_text = f"Sản phẩm: {name}. Danh mục: {cat}. Giá: {formatted_price}. Thông số kỹ thuật: {specs_str}"
        chunks.append({
            "chunk_id": f"{p_id}_spec",
            "product_id": p_id,
            "product_name": name,
            "category": cat,
            "price": price,
            "chunk_type": "SPECIFICATION",
            "text": spec_chunk_text
        })

        # 2. Desc Chunk (Mô tả & Nổi bật)
        if desc:
            desc_chunk_text = f"Sản phẩm: {name}. Danh mục: {cat}. Mô tả chi tiết: {desc[:1000]}"
            chunks.append({
                "chunk_id": f"{p_id}_desc",
                "product_id": p_id,
                "product_name": name,
                "category": cat,
                "price": price,
                "chunk_type": "DESCRIPTION",
                "text": desc_chunk_text
            })

        # 3. FAQ / Policy Chunk (Nhu cầu & Chính sách)
        faq_text = f"Tư vấn sản phẩm {name} ({cat}). Mức giá: {formatted_price}. Chính sách bảo hành chính hãng, trả góp 0%, giao hàng toàn quốc."
        chunks.append({
            "chunk_id": f"{p_id}_faq",
            "product_id": p_id,
            "product_name": name,
            "category": cat,
            "price": price,
            "chunk_type": "FAQ_POLICY",
            "text": faq_text
        })
        
    return chunks

def build_platinum_layer(silver_path: str = SILVER_PATH, preferred_model: str = PRIMARY_MODEL):
    """
    Platinum Layer Processing:
    1. Chunking cấu trúc (Spec, Desc, FAQ).
    2. Encode BGE-M3 Dense Vectors ➔ Lưu FAISS Index.
    3. Tokenize & Xây dựng BM25 Sparse Index ➔ Lưu pickle.
    4. Lưu Metadata Chunks.
    """
    logging.info(f"🚀 [PLATINUM LAYER] Bắt đầu đọc dữ liệu Silver từ {silver_path}")
    
    if not os.path.exists(silver_path):
        raise FileNotFoundError(f"Không tìm thấy file Silver tại: {silver_path}")
        
    with open(silver_path, "r", encoding="utf-8") as f:
        silver_data = json.load(f)
        products = silver_data.get("records", [])

    logging.info(f"✂️ Đang tiến hành Structured Chunking cho {len(products)} sản phẩm...")
    chunks = create_structured_chunks(products)
    logging.info(f"✅ Đã tạo {len(chunks)} Chunks có cấu trúc (Specs, Desc, FAQ).")

    # --- 1. SINK DENSE EMBEDDING (BGE-M3 / SentenceTransformers) ---
    logging.info(f"🧠 Đang nạp Model Embedding: {preferred_model}...")
    try:
        model = SentenceTransformer(preferred_model)
        actual_model_name = preferred_model
    except Exception as e:
        logging.warning(f"⚠️ Không nạp được {preferred_model} ({e}), chuyển sang fallback: {FALLBACK_MODEL}")
        model = SentenceTransformer(FALLBACK_MODEL)
        actual_model_name = FALLBACK_MODEL

    corpus_texts = [c["text"] for c in chunks]
    logging.info(f"⚡ Đang encode {len(corpus_texts)} chunks thành Vector (Normalize Cosine)...")
    
    embeddings = model.encode(
        corpus_texts,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True
    ).astype(np.float32)

    # Khởi tạo FAISS Index (IndexFlatIP)
    dimension = embeddings.shape[1]
    logging.info(f"📐 Kích thước Vector Embedding: {dimension}-D (Model: {actual_model_name})")
    faiss_index = faiss.IndexFlatIP(dimension)
    faiss_index.add(embeddings)
    
    os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
    faiss.write_index(faiss_index, FAISS_INDEX_PATH)
    logging.info(f"✅ Đã lưu FAISS Index vào: {FAISS_INDEX_PATH}")

    # --- 2. SINK SPARSE INDEX (BM25) ---
    logging.info("🔤 Đang khởi tạo BM25 Sparse Index cho Hybrid Search...")
    tokenized_corpus = [tokenize_vietnamese(c["text"]) for c in chunks]
    bm25 = BM25Okapi(tokenized_corpus)
    
    with open(BM25_INDEX_PATH, "wb") as f:
        pickle.dump({"bm25": bm25, "tokenized_corpus": tokenized_corpus}, f)
    logging.info(f"✅ Đã lưu BM25 Index vào: {BM25_INDEX_PATH}")

    # --- 3. SINK METADATA ---
    metadata_payload = {
        "metadata": {
            "layer": "PLATINUM",
            "model_name": actual_model_name,
            "vector_dimension": dimension,
            "total_chunks": len(chunks),
            "total_products": len(products),
            "created_at": datetime.now().isoformat()
        },
        "chunks": chunks
    }
    
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata_payload, f, ensure_ascii=False, indent=2)
    logging.info(f"✅ Đã lưu Chunk Metadata vào: {METADATA_PATH}")

    return metadata_payload

if __name__ == "__main__":
    build_platinum_layer()
