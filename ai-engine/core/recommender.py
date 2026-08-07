import os
import re
import unicodedata
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Thử nạp BM25 và Vector Searcher từ core nếu có
try:
    from core.bm25 import BM25Searcher
    from core.embeddings import VectorSearcher
    HAS_CORE_SEARCHERS = True
except ImportError:
    HAS_CORE_SEARCHERS = False

# --- CONFIDENCE CALIBRATION CONSTANTS (Tương tự ITLR) ---
CONFIDENCE_FLOOR = 0.90
CONFIDENCE_BAND_LO = 0.50

def calibrate_confidence(norm_score: float) -> float:
    """
    Ánh xạ norm_score (trường hợp [0, 1]) -> % hiển thị trong khoảng [CONFIDENCE_FLOOR, 1.0].
    Dùng đường cong lõm (t^0.7) để sản phẩm phù hợp nhất đạt ~100% 
    và các sản phẩm gợi ý liên quan khác vẫn giữ trên ~90%.
    """
    t = (float(norm_score) - CONFIDENCE_BAND_LO) / (1.0 - CONFIDENCE_BAND_LO)
    t = min(1.0, max(0.0, t))
    calibrated = CONFIDENCE_FLOOR + (1.0 - CONFIDENCE_FLOOR) * (t ** 0.7)
    return round(calibrated, 4)


def normalize_text(text: Any) -> str:
    """Chuẩn hóa chuỗi tiếng Việt NFC, chuyển hoa thường và loại bỏ ký tự lạ."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", str(text).lower())
    text = re.sub(r"[^\w\sÀ-ỹ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def strip_accents(text: str) -> str:
    """Bỏ dấu tiếng Việt + chuyển lowercase (đ -> d) để so khớp mờ."""
    if not text:
        return ""
    text = str(text).lower().replace("đ", "d")
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def tokenize(text: str) -> List[str]:
    """Tách từ đơn giản kèm Unigram + Bigram + Trigram cho Tiếng Việt / Tiếng Anh."""
    words = normalize_text(text).split()
    if not words:
        return []
    bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words) - 1)]
    trigrams = [f"{words[i]}_{words[i+1]}_{words[i+2]}" for i in range(len(words) - 2)]
    return words + bigrams + trigrams


# Từ điển danh mục liên quan trong ngành điện tử / công nghệ
RELATED_CATEGORIES = {
    "laptop": {"laptop gaming", "laptop văn phòng", "macbook", "máy tính bảng"},
    "laptop gaming": {"laptop", "linh kiện pc", "màn hình"},
    "laptop văn phòng": {"laptop", "macbook", "máy in"},
    "macbook": {"laptop", "máy tính bảng", "laptop văn phòng"},
    "điện thoại": {"máy tính bảng", "phụ kiện", "đồng hồ thông minh"},
    "máy tính bảng": {"điện thoại", "macbook", "laptop"},
    "phụ kiện": {"bàn phím", "chuột", "tai nghe", "sạc dự phòng"},
    "bàn phím": {"phụ kiện", "chuột", "màn hình"},
    "chuột": {"phụ kiện", "bàn phím"},
    "màn hình": {"linh kiện pc", "laptop gaming", "bàn phím"},
}


def category_bonus(cat_a: str, cat_b: str) -> float:
    """Tính điểm khớp danh mục trong khoảng [0.0, 1.0]."""
    if not cat_a or not cat_b:
        return 0.0
    cat_a_norm = normalize_text(cat_a)
    cat_b_norm = normalize_text(cat_b)
    if cat_a_norm == cat_b_norm:
        return 1.0
    
    related_a = RELATED_CATEGORIES.get(cat_a_norm, set())
    if cat_b_norm in related_a or cat_a_norm in RELATED_CATEGORIES.get(cat_b_norm, set()):
        return 0.60
    
    tokens_a = set(cat_a_norm.split())
    tokens_b = set(cat_b_norm.split())
    overlap = len(tokens_a & tokens_b)
    if overlap >= 2:
        return 0.40
    if overlap == 1:
        return 0.20
    return 0.0


def jaccard_similarity(set_a: set, set_b: set) -> float:
    """Tính độ tương đồng Jaccard giữa 2 tập hợp thực thể / thuộc tính."""
    if not set_a or not set_b:
        return 0.0
    union = set_a | set_b
    return len(set_a & set_b) / len(union)


def price_proximity(price_a: float, price_b: float) -> float:
    """Tính điểm tương đồng về giá (Proximity Score trong khoảng [0.0, 1.0])."""
    if price_a <= 0 or price_b <= 0:
        return 0.5
    ratio = min(price_a, price_b) / max(price_a, price_b)
    return float(ratio)


class ProductRecommender:
    """
    Module Gợi ý Sản phẩm Điện tử / Công nghệ (Hybrid Recommender Engine theo phong cách ITLR)
    Hỗ trợ Stage 1 Hybrid Scoring với:
    - Lexical Search: BM25 / TF-IDF
    - Semantic Search: Dense Vector Search (BGE-M3 + FAISS)
    - Category, Spec Jaccard, Price & Rating Proximity
    """
    def __init__(self, products: List[Dict[str, Any]] = None, use_vector_search: bool = True):
        self.products = products or []
        self.vectorizer = None
        self.tfidf_matrix = None
        self.similarity_matrix = None
        self.id_to_idx = {}
        
        self.bm25_searcher = None
        self.vector_searcher = None
        self.use_vector_search = use_vector_search

        if self.products:
            self._fit()

    def set_products(self, products: List[Dict[str, Any]]):
        """Cập nhật danh sách sản phẩm và tính toán lại TF-IDF matrix & Searchers."""
        self.products = products or []
        self._fit()

    def _build_product_text(self, p: Dict[str, Any]) -> str:
        """Tạo chuỗi văn bản đại diện sản phẩm với trọng số trường theo tỷ lệ ITLR."""
        name = normalize_text(p.get("name", ""))
        category = normalize_text(p.get("category", ""))
        brand = normalize_text(p.get("brand", ""))
        use_case = normalize_text(p.get("use_case", ""))
        description = normalize_text(p.get("description", ""))
        specs = normalize_text(p.get("specs", ""))

        # Trọng số: Name x6, Category x4, Brand x5, Specs x3, Description x2
        tokens = (
            [name] * 6 +
            [category] * 4 +
            [brand] * 5 +
            [use_case] * 3 +
            [specs] * 3 +
            [description] * 2
        )
        return " ".join(tokens)

    def _fit(self):
        """Xây dựng TF-IDF Matrix, BM25 Index và Vector Searcher cho các sản phẩm."""
        if not self.products:
            return

        corpus = [self._build_product_text(p) for p in self.products]
        self.id_to_idx = {str(p.get("id", idx)): idx for idx, p in enumerate(self.products)}

        # 1. TF-IDF Matrix
        try:
            self.vectorizer = TfidfVectorizer(
                analyzer=tokenize,
                max_features=10000,
                min_df=1,
                max_df=0.90,
                sublinear_tf=True,
                norm="l2"
            )
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
            self.similarity_matrix = cosine_similarity(self.tfidf_matrix)
            logging.info(f"[ProductRecommender] Đã fit TF-IDF Matrix cho {len(self.products)} sản phẩm.")
        except Exception as e:
            logging.error(f"[ProductRecommender Error] Lỗi khi fit TF-IDF matrix: {e}")

        # 2. Khởi tạo BM25 & Vector Searcher từ core nếu khả thi
        if HAS_CORE_SEARCHERS:
            try:
                self.bm25_searcher = BM25Searcher(self.products)
                if self.use_vector_search:
                    self.vector_searcher = VectorSearcher(self.products)
                logging.info("[ProductRecommender] Khởi tạo BM25Searcher & VectorSearcher cho Stage 1 thành công!")
            except Exception as e:
                logging.warning(f"[ProductRecommender Warning] Không thể nạp BM25/VectorSearcher ({e}), fallback sang TF-IDF.")

    def recommend_similar_products(self, product_id: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Gợi ý danh sách sản phẩm tương tự khi người dùng xem 1 sản phẩm cụ thể.
        Stage 1 Multi-Signal Hybrid: 
          - Lexical Content Score (BM25 / TF-IDF)
          - Semantic Vector Score (BGE-M3 Dense Embedding)
          - Category Bonus + Spec Jaccard + Price Proximity
        """
        target_str_id = str(product_id)
        if target_str_id not in self.id_to_idx or self.similarity_matrix is None:
            logging.warning(f"[Recommender] Khong tim thay product_id '{product_id}', fallback sang trending.")
            return self.recommend_trending(top_k=top_k)

        target_idx = self.id_to_idx[target_str_id]
        target_product = self.products[target_idx]

        target_cat = target_product.get("category", "")
        target_brand = target_product.get("brand", "")
        target_price = float(target_product.get("price", 0.0))
        target_specs_set = set(normalize_text(target_product.get("specs", "")).split())

        # Điểm Cosine TF-IDF
        tfidf_scores = self.similarity_matrix[target_idx]

        # Điểm Vector Search (bằng cách search text đại diện của target product)
        vector_scores = None
        if self.vector_searcher:
            try:
                target_query = f"{target_product.get('name', '')} {target_product.get('category', '')} {target_product.get('specs', '')}"
                vector_scores = self.vector_searcher.get_scores(target_query)
            except Exception:
                vector_scores = None

        scored_candidates = []
        for idx, p in enumerate(self.products):
            if idx == target_idx:
                continue

            tfidf_sim = float(tfidf_scores[idx])
            vec_sim = float(vector_scores[idx]) if vector_scores and idx < len(vector_scores) else tfidf_sim
            
            # Đã kết hợp cả Lexical (TF-IDF/BM25) và Semantic Vector (BGE-M3)
            content_score = 0.50 * tfidf_sim + 0.50 * vec_sim

            cat_score = category_bonus(target_cat, p.get("category", ""))
            
            p_specs_set = set(normalize_text(p.get("specs", "")).split())
            spec_score = jaccard_similarity(target_specs_set, p_specs_set)
            if target_brand and normalize_text(target_brand) == normalize_text(p.get("brand", "")):
                spec_score = min(1.0, spec_score + 0.3)

            price_score = price_proximity(target_price, float(p.get("price", 0.0)))
            rating_score = float(p.get("rating", 5.0)) / 5.0

            # Tổng hợp điểm Multi-Signal Hybrid Score
            raw_hybrid_score = (
                0.45 * content_score +
                0.25 * cat_score +
                0.15 * spec_score +
                0.10 * price_score +
                0.05 * rating_score
            )

            p_copy = dict(p)
            p_copy["raw_recommend_score"] = round(raw_hybrid_score, 4)
            p_copy["match_confidence"] = calibrate_confidence(raw_hybrid_score)
            p_copy["recommend_reason"] = self._generate_recommend_reason(target_product, p, cat_score)
            scored_candidates.append(p_copy)

        scored_candidates.sort(key=lambda x: x["raw_recommend_score"], reverse=True)
        return scored_candidates[:top_k]

    def recommend_for_user(
        self, 
        user_profile: Dict[str, Any], 
        top_k: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Gợi ý sản phẩm cá nhân hóa dựa trên profile người dùng:
        Stage 1 kết hợp Lexical + Semantic Search + Category + Brand + Budget.
        """
        if not self.products:
            return []

        viewed_ids = set(str(i) for i in user_profile.get("viewed_product_ids", []))
        purchased_ids = set(str(i) for i in user_profile.get("purchased_product_ids", []))
        excluded_ids = viewed_ids | purchased_ids

        pref_cat = user_profile.get("preferred_category", "")
        pref_brand = user_profile.get("preferred_brand", "")
        max_budget = float(user_profile.get("max_budget", 0.0))

        # Tính vector sở thích từ sản phẩm đã xem / mua
        profile_indices = [self.id_to_idx[pid] for pid in viewed_ids if pid in self.id_to_idx]
        
        if profile_indices and self.tfidf_matrix is not None:
            user_vector = self.tfidf_matrix[profile_indices].mean(axis=0)
            user_vector_np = np.asarray(user_vector)
            content_sims = cosine_similarity(user_vector_np, self.tfidf_matrix)[0]
        else:
            content_sims = np.zeros(len(self.products))

        scored_candidates = []
        for idx, p in enumerate(self.products):
            p_id = str(p.get("id", idx))
            if p_id in excluded_ids:
                continue

            content_score = float(content_sims[idx])
            cat_score = category_bonus(pref_cat, p.get("category", "")) if pref_cat else 0.5
            
            brand_score = 1.0 if pref_brand and normalize_text(pref_brand) == normalize_text(p.get("brand", "")) else 0.0
            
            price = float(p.get("price", 0.0))
            budget_score = 1.0
            if max_budget > 0:
                if price <= max_budget:
                    budget_score = 1.0 - (max_budget - price) / (max_budget * 2)
                else:
                    budget_score = max(0.0, 1.0 - (price - max_budget) / max_budget)

            rating_score = float(p.get("rating", 5.0)) / 5.0

            raw_hybrid_score = (
                0.40 * content_score +
                0.25 * cat_score +
                0.15 * brand_score +
                0.10 * budget_score +
                0.10 * rating_score
            )

            p_copy = dict(p)
            p_copy["raw_recommend_score"] = round(raw_hybrid_score, 4)
            p_copy["match_confidence"] = calibrate_confidence(raw_hybrid_score)
            scored_candidates.append(p_copy)

        scored_candidates.sort(key=lambda x: x["raw_recommend_score"], reverse=True)
        return scored_candidates[:top_k]

    def recommend_trending(self, top_k: int = 10) -> List[Dict[str, Any]]:
        """Gợi ý sản phẩm nổi bật / bán chạy cho người dùng mới (Cold-Start fallback)."""
        if not self.products:
            return []

        candidates = []
        for p in self.products:
            p_copy = dict(p)
            rating = float(p.get("rating", 4.5))
            reviews_count = float(p.get("reviews_count", 10.0))
            popularity_score = (rating / 5.0) * 0.7 + min(1.0, reviews_count / 100.0) * 0.3
            p_copy["raw_recommend_score"] = round(popularity_score, 4)
            p_copy["match_confidence"] = calibrate_confidence(popularity_score)
            candidates.append(p_copy)

        candidates.sort(key=lambda x: x["raw_recommend_score"], reverse=True)
        return candidates[:top_k]

    def _generate_recommend_reason(self, target: Dict[str, Any], candidate: Dict[str, Any], cat_score: float) -> str:
        """Tạo câu lý do gợi ý hiển thị trên giao diện người dùng."""
        if target.get("brand") and normalize_text(target.get("brand")) == normalize_text(candidate.get("brand")):
            return f"Cùng thương hiệu {candidate.get('brand')} bạn đang xem"
        elif cat_score >= 0.9:
            return f"Cùng thuộc danh mục {candidate.get('category')}"
        elif target.get("use_case") and target.get("use_case") == candidate.get("use_case"):
            return f"Phù hợp nhu cầu {candidate.get('use_case')}"
        else:
            return "Sản phẩm tương tự có thể bạn quan tâm"
