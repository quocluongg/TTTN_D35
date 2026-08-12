"""Product recommender: TF-IDF + category bonus + spec Jaccard + price proximity."""
import logging
import re
import unicodedata
from typing import Any, Dict, List

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# Confidence calibration
_CONFIDENCE_FLOOR = 0.90
_CONFIDENCE_BAND_LO = 0.50

# Related categories
RELATED_CATEGORIES = {
    "laptop": {"laptop gaming", "laptop văn phòng", "macbook", "máy tính bảng"},
    "laptop gaming": {"laptop", "linh kiện pc", "màn hình"},
    "laptop văn phòng": {"laptop", "macbook"},
    "macbook": {"laptop", "máy tính bảng", "laptop văn phòng"},
    "điện thoại": {"máy tính bảng", "phụ kiện", "đồng hồ thông minh"},
    "máy tính bảng": {"điện thoại", "macbook", "laptop"},
    "phụ kiện": {"bàn phím", "chuột", "tai nghe", "sạc dự phòng"},
    "bàn phím": {"phụ kiện", "chuột", "màn hình"},
    "chuột": {"phụ kiện", "bàn phím"},
    "màn hình": {"linh kiện pc", "laptop gaming", "bàn phím"},
}


def calibrate_confidence(norm_score: float) -> float:
    """Map norm_score to display band [CONFIDENCE_FLOOR, 1.0]."""
    t = (float(norm_score) - _CONFIDENCE_BAND_LO) / (1.0 - _CONFIDENCE_BAND_LO)
    t = min(1.0, max(0.0, t))
    return round(_CONFIDENCE_FLOOR + (1.0 - _CONFIDENCE_FLOOR) * (t ** 0.7), 4)


def normalize_text(text: Any) -> str:
    """NFC normalize + lowercase + remove special chars."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", str(text).lower())
    text = re.sub(r"[^\w\sÀ-ỹ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def strip_accents(text: str) -> str:
    """Remove Vietnamese diacritics."""
    if not text:
        return ""
    text = str(text).lower().replace("đ", "d")
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def category_bonus(cat_a: str, cat_b: str) -> float:
    """Category match score [0.0, 1.0]."""
    if not cat_a or not cat_b:
        return 0.0
    a, b = normalize_text(cat_a), normalize_text(cat_b)
    if a == b:
        return 1.0
    if b in RELATED_CATEGORIES.get(a, set()) or a in RELATED_CATEGORIES.get(b, set()):
        return 0.60
    overlap = len(set(a.split()) & set(b.split()))
    if overlap >= 2:
        return 0.40
    if overlap == 1:
        return 0.20
    return 0.0


def jaccard_similarity(set_a: set, set_b: set) -> float:
    """Jaccard similarity between two sets."""
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)


def price_proximity(price_a: float, price_b: float) -> float:
    """Price similarity [0.0, 1.0]."""
    if price_a <= 0 or price_b <= 0:
        return 0.5
    return float(min(price_a, price_b) / max(price_a, price_b))


def _tokenize_ngrams(text: str) -> List[str]:
    """Unigram + bigram + trigram tokenizer."""
    words = normalize_text(text).split()
    if not words:
        return []
    bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words) - 1)]
    trigrams = [f"{words[i]}_{words[i+1]}_{words[i+2]}" for i in range(len(words) - 2)]
    return words + bigrams + trigrams


class ProductRecommender:
    """Hybrid product recommender using TF-IDF + multi-signal scoring."""

    def __init__(self, products: List[Dict[str, Any]] = None):
        self.products = products or []
        self.vectorizer = None
        self.tfidf_matrix = None
        self.similarity_matrix = None
        self.id_to_idx = {}

        if self.products:
            self._fit()

    def _build_product_text(self, p: Dict[str, Any]) -> str:
        """Build weighted text representation for TF-IDF."""
        parts = (
            [normalize_text(p.get("name", ""))] * 6
            + [normalize_text(p.get("category", ""))] * 4
            + [normalize_text(p.get("brand", ""))] * 5
            + [normalize_text(p.get("use_case", ""))] * 3
            + [normalize_text(p.get("specs", ""))] * 3
            + [normalize_text(p.get("description", ""))] * 2
        )
        return " ".join(parts)

    def _fit(self):
        """Build TF-IDF matrix."""
        if not self.products:
            return
        corpus = [self._build_product_text(p) for p in self.products]
        self.id_to_idx = {str(p.get("id", idx)): idx for idx, p in enumerate(self.products)}
        try:
            self.vectorizer = TfidfVectorizer(
                analyzer=_tokenize_ngrams, max_features=10000,
                min_df=1, max_df=0.90, sublinear_tf=True, norm="l2",
            )
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
            self.similarity_matrix = cosine_similarity(self.tfidf_matrix)
            logger.info(f"[Recommender] Fitted TF-IDF for {len(self.products)} products.")
        except Exception as e:
            logger.error(f"[Recommender] TF-IDF fit failed: {e}")

    def recommend_similar(self, product_id: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Recommend products similar to a given product."""
        sid = str(product_id)
        if sid not in self.id_to_idx or self.similarity_matrix is None:
            return self.recommend_trending(top_k=top_k)

        idx = self.id_to_idx[sid]
        target = self.products[idx]
        tfidf_scores = self.similarity_matrix[idx]

        target_cat = target.get("category", "")
        target_brand = normalize_text(target.get("brand", ""))
        target_price = float(target.get("price", 0.0))
        target_specs = set(normalize_text(target.get("specs", "")).split())

        scored = []
        for i, p in enumerate(self.products):
            if i == idx:
                continue
            content = float(tfidf_scores[i])
            cat = category_bonus(target_cat, p.get("category", ""))
            specs = set(normalize_text(p.get("specs", "")).split())
            spec = jaccard_similarity(target_specs, specs)
            if target_brand and target_brand == normalize_text(p.get("brand", "")):
                spec = min(1.0, spec + 0.3)
            price = price_proximity(target_price, float(p.get("price", 0.0)))
            rating = float(p.get("rating", 5.0)) / 5.0

            raw = 0.45 * content + 0.25 * cat + 0.15 * spec + 0.10 * price + 0.05 * rating
            p_copy = dict(p)
            p_copy["raw_recommend_score"] = round(raw, 4)
            p_copy["match_confidence"] = calibrate_confidence(raw)
            scored.append(p_copy)

        scored.sort(key=lambda x: x["raw_recommend_score"], reverse=True)
        return scored[:top_k]

    def recommend_trending(self, top_k: int = 10) -> List[Dict[str, Any]]:
        """Cold-start trending products."""
        if not self.products:
            return []
        scored = []
        for p in self.products:
            rating = float(p.get("rating", 4.5))
            reviews = float(p.get("reviews_count", 10.0))
            pop = (rating / 5.0) * 0.7 + min(1.0, reviews / 100.0) * 0.3
            p_copy = dict(p)
            p_copy["raw_recommend_score"] = round(pop, 4)
            p_copy["match_confidence"] = calibrate_confidence(pop)
            scored.append(p_copy)
        scored.sort(key=lambda x: x["raw_recommend_score"], reverse=True)
        return scored[:top_k]
