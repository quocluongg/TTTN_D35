import os
import json
import numpy as np
import faiss
import logging
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "data", "processed", "faiss_index.bin")
METADATA_PATH = os.path.join(BASE_DIR, "data", "processed", "chunks_metadata.json")

class VectorSearcher:
    """Module tìm kiếm ngữ nghĩa (Semantic Vector Search) dùng BGE-M3 + FAISS Index (Pre-built Platinum Layer)"""
    def __init__(self, products: List[Dict] = None, model_name: str = "BAAI/bge-m3"):
        self.products = products or []
        self.model_name = model_name
        self.chunks = []
        self.index = None
        self.model = None

        # 1. Thử load Pre-built Index từ tầng Platinum (data/processed/)
        if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(METADATA_PATH):
            try:
                logging.info(f"📂 Nạp FAISS Index từ file pre-built: {FAISS_INDEX_PATH}")
                self.index = faiss.read_index(FAISS_INDEX_PATH)
                with open(METADATA_PATH, "r", encoding="utf-8") as f:
                    meta_data = json.load(f)
                    self.chunks = meta_data.get("chunks", [])
                    meta_info = meta_data.get("metadata", {})
                    if "model_name" in meta_info:
                        self.model_name = meta_info["model_name"]
                
                logging.info(f"⚡ Đã nạp FAISS Index thành công! Total Chunks: {self.index.ntotal}, Model: {self.model_name}")
            except Exception as e:
                logging.warning(f"⚠️ Không nạp được FAISS index pre-built ({e}). Sẽ fallback sang encode realtime.")
                self.index = None

        # 2. Load Model Embedding
        try:
            self.model = SentenceTransformer(self.model_name)
        except Exception as e:
            fallback = "paraphrase-multilingual-MiniLM-L12-v2"
            logging.warning(f"⚠️ Không load được model {self.model_name} ({e}), chuyển sang fallback: {fallback}")
            self.model = SentenceTransformer(fallback)

        # 3. Fallback hoặc nạp embeddings matrix cho MMR Stage 3
        if self.index is not None and hasattr(self.index, 'reconstruct_n'):
            try:
                self.embeddings = self.index.reconstruct_n(0, self.index.ntotal)
            except Exception as e:
                logging.warning(f"⚠️ Không thể reconstruct vector từ FAISS index ({e}). Sẽ encode realtime khi cần.")
                self.embeddings = None
        else:
            self.embeddings = None

        if self.index is None and self.products:
            logging.info("🔄 Đang encode realtime sản phẩm thành FAISS Index...")
            corpus = [
                f"Sản phẩm: {p.get('name', '')}. Danh mục: {p.get('category', '')}. Mô tả: {p.get('description', '')}"
                for p in self.products
            ]
            self.embeddings = self.model.encode(
                corpus, batch_size=32, normalize_embeddings=True, convert_to_numpy=True
            ).astype(np.float32)
            self.dimension = self.embeddings.shape[1]
            self.index = faiss.IndexFlatIP(self.dimension)
            self.index.add(self.embeddings)

    def get_scores(self, query: str) -> List[float]:
        """Tính điểm tương đồng Cosine giữa Query và từng sản phẩm"""
        num_products = len(self.products)
        if not query.strip() or self.index is None or num_products == 0:
            return [0.0] * num_products

        query_vector = self.model.encode(
            [query], normalize_embeddings=True, convert_to_numpy=True
        ).astype(np.float32)

        total_items = self.index.ntotal
        distances, indices = self.index.search(query_vector, total_items)

        if self.chunks and len(self.chunks) == total_items:
            # Map chunk scores to product_id (lấy điểm cao nhất của chunk thuộc sản phẩm)
            product_scores_map = {}
            for dist, idx in zip(distances[0], indices[0]):
                if 0 <= idx < len(self.chunks):
                    p_id = str(self.chunks[idx].get("product_id", ""))
                    score = float((dist + 1.0) / 2.0)
                    if p_id not in product_scores_map or score > product_scores_map[p_id]:
                        product_scores_map[p_id] = score

            scores = []
            for p in self.products:
                p_id = str(p.get("id", ""))
                scores.append(product_scores_map.get(p_id, 0.0))
            return scores
        else:
            scores = [0.0] * num_products
            for dist, idx in zip(distances[0], indices[0]):
                if 0 <= idx < num_products:
                    scores[idx] = float((dist + 1.0) / 2.0)
            return scores

    def search_chunks(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Trả về Top K Chunks phù hợp nhất cho RAG Assistant"""
        if not query.strip() or self.index is None or not self.chunks:
            return []

        query_vector = self.model.encode(
            [query], normalize_embeddings=True, convert_to_numpy=True
        ).astype(np.float32)

        distances, indices = self.index.search(query_vector, min(top_k, self.index.ntotal))

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if 0 <= idx < len(self.chunks):
                chunk_info = dict(self.chunks[idx])
                chunk_info["similarity_score"] = round(float((dist + 1.0) / 2.0), 4)
                results.append(chunk_info)
        return results
