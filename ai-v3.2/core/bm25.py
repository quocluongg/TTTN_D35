import os
import re
import pickle
import logging
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BM25_INDEX_PATH = os.path.join(BASE_DIR, "data", "processed", "bm25_index.pkl")

def tokenize(text: str) -> List[str]:
    """Tách từ đơn giản cho tiếng Việt / tiếng Anh"""
    if not text:
        return []
    return re.findall(r'\w+', text.lower())

class BM25Searcher:
    """Module tìm kiếm từ vựng Lexical bằng BM25 (Hỗ trợ Pre-built Platinum Layer)"""
    def __init__(self, products: List[Dict] = None):
        self.products = products or []
        self.bm25 = None
        self.corpus_tokens = []

        # 1. Thử load Pre-built BM25 Index từ file pickle
        if os.path.exists(BM25_INDEX_PATH):
            try:
                logging.info(f"📂 Nạp BM25 Index từ file pre-built: {BM25_INDEX_PATH}")
                with open(BM25_INDEX_PATH, "rb") as f:
                    payload = pickle.load(f)
                    self.bm25 = payload.get("bm25")
                    self.corpus_tokens = payload.get("tokenized_corpus", [])
                logging.info(f"⚡ Đã nạp BM25 Index thành công cho {len(self.corpus_tokens)} chunks!")
            except Exception as e:
                logging.warning(f"⚠️ Không nạp được BM25 index pre-built ({e}). Fallback sang build realtime.")
                self.bm25 = None

        # 2. Fallback: Build Realtime nếu chưa có Pre-built Index
        if self.bm25 is None and self.products:
            logging.info("🔄 Đang xây dựng BM25 Index realtime...")
            for p in self.products:
                full_text = f"{p.get('name', '')} {p.get('category', '')} {p.get('use_case', '')} {p.get('description', '')}"
                tokens = tokenize(full_text)
                self.corpus_tokens.append(tokens)
            self.bm25 = BM25Okapi(self.corpus_tokens)

    def get_scores(self, query: str) -> List[float]:
        """Tính điểm BM25 cho tất cả sản phẩm/chunks dựa vào câu truy vấn"""
        if not self.bm25 or not query.strip():
            return [0.0] * len(self.corpus_tokens)
            
        query_tokens = tokenize(query)
        if not query_tokens:
            return [0.0] * len(self.corpus_tokens)
            
        scores = self.bm25.get_scores(query_tokens)
        max_s = max(scores) if len(scores) > 0 and max(scores) > 0 else 1.0
        normalized_scores = [float(s / max_s) for s in scores]
        return normalized_scores
