"""
Module tính toán các chỉ số Đánh giá & Benchmark chuẩn ngành (Information Retrieval / Recommender Systems)
Hỗ trợ: Precision@K, Recall@K, HitRate@K, NDCG@K, MAP, MRR
Kế thừa công thức chuẩn từ ITLR Framework.
"""

from typing import Dict, Iterable, List, Sequence, Optional
import numpy as np

DEFAULT_KS = (1, 3, 5, 10)


def _as_array(ranked_rels: Sequence[float]) -> np.ndarray:
    return np.asarray(list(ranked_rels), dtype="float64")


def precision_at_k(ranked_rels: Sequence[float], k: int) -> float:
    """Tỉ lệ item liên quan (rel > 0) trong K kết quả đầu tiên."""
    if k <= 0:
        return 0.0
    top = _as_array(ranked_rels)[:k]
    if top.size == 0:
        return 0.0
    return float((top > 0).sum()) / k


def recall_at_k(ranked_rels: Sequence[float], k: int, n_relevant: int) -> float:
    """Tỉ lệ item liên quan bắt được trong top-K trên tổng số item liên quan thực tế."""
    if n_relevant <= 0 or k <= 0:
        return 0.0
    top = _as_array(ranked_rels)[:k]
    return float((top > 0).sum()) / n_relevant


def hit_rate_at_k(ranked_rels: Sequence[float], k: int) -> float:
    """Trả về 1.0 nếu có ÍT NHẤT 1 item liên quan trong top-K, ngược lại 0.0."""
    top = _as_array(ranked_rels)[:k]
    return 1.0 if (top > 0).any() else 0.0


def dcg_at_k(ranked_rels: Sequence[float], k: int) -> float:
    """Discounted Cumulative Gain với chiết khấu vị trí log2(rank + 1)."""
    rels = _as_array(ranked_rels)[:k]
    if rels.size == 0:
        return 0.0
    gains = (2.0 ** rels) - 1.0
    discounts = 1.0 / np.log2(np.arange(2, rels.size + 2))
    return float(np.sum(gains * discounts))


def ndcg_at_k(ranked_rels: Sequence[float], k: int, ideal_rels: Optional[Sequence[float]] = None) -> float:
    """Normalized Discounted Cumulative Gain (NDCG@K) chuẩn hóa trong dải [0, 1]."""
    if ideal_rels is None:
        ideal = np.sort(_as_array(ranked_rels))[::-1]
    else:
        ideal = np.sort(_as_array(ideal_rels))[::-1]
    idcg = dcg_at_k(ideal, k)
    if idcg <= 0:
        return 0.0
    return dcg_at_k(ranked_rels, k) / idcg


def average_precision(ranked_rels: Sequence[float], n_relevant: Optional[int] = None) -> float:
    """Average Precision (AP) tại mỗi vị trí xuất hiện hit liên quan."""
    rels = _as_array(ranked_rels)
    hits = rels > 0
    if not hits.any():
        return 0.0
    cum_hits = np.cumsum(hits)
    ranks = np.arange(1, rels.size + 1)
    precisions = cum_hits / ranks
    denom = n_relevant if (n_relevant and n_relevant > 0) else int(hits.sum())
    return float(np.sum(precisions * hits) / denom)


def reciprocal_rank(ranked_rels: Sequence[float]) -> float:
    """Nghịch đảo thứ hạng (1 / Rank) của item liên quan ĐẦU TIÊN (MRR component)."""
    rels = _as_array(ranked_rels)
    hit_positions = np.where(rels > 0)[0]
    if hit_positions.size == 0:
        return 0.0
    return 1.0 / (hit_positions[0] + 1)


def per_query_metrics(
    ranked_rels: Sequence[float],
    n_relevant: int,
    ks: Iterable[int] = DEFAULT_KS,
    ideal_rels: Optional[Sequence[float]] = None,
) -> Dict[str, float]:
    """Tính toán bộ chỉ số cho một trường hợp kiểm thử."""
    out: Dict[str, float] = {}
    for k in ks:
        out[f"P@{k}"] = precision_at_k(ranked_rels, k)
        out[f"R@{k}"] = recall_at_k(ranked_rels, k, n_relevant)
        out[f"NDCG@{k}"] = ndcg_at_k(ranked_rels, k, ideal_rels=ideal_rels)
        out[f"HitRate@{k}"] = hit_rate_at_k(ranked_rels, k)
    out["MAP"] = average_precision(ranked_rels, n_relevant)
    out["MRR"] = reciprocal_rank(ranked_rels)
    return out


def evaluate_rankings(
    rankings: Sequence[Sequence[float]],
    n_relevants: Sequence[int],
    ks: Iterable[int] = DEFAULT_KS,
) -> Dict[str, float]:
    """Tổng hợp chỉ số trung bình (Macro Average) trên toàn bộ danh sách kiểm thử."""
    rows: List[Dict[str, float]] = []
    for rels, n_rel in zip(rankings, n_relevants):
        rows.append(per_query_metrics(rels, n_rel, ks=ks))
    
    if not rows:
        return {}
    keys = rows[0].keys()
    return {k: float(np.mean([r.get(k, 0.0) for r in rows])) for k in keys}
