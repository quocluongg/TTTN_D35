"""
Evaluation Module: Đánh giá hiệu năng của bộ Retrieval (Hybrid Search + RRF + Reranker).
Các chỉ số: Recall@K, Mean Reciprocal Rank (MRR).
"""
from typing import List, Set


def recall_at_k(retrieved_ids: List[str], ground_truth_ids: Set[str] | List[str], k: int = 5) -> float:
    """
    Tính Recall@K: Tỷ lệ các tài liệu đúng (ground truth) xuất hiện trong top K tài liệu tìm kiếm được.
    """
    if not ground_truth_ids:
        return 0.0

    gt_set = set(ground_truth_ids)
    top_k_retrieved = set(retrieved_ids[:k])

    hits = gt_set.intersection(top_k_retrieved)
    return len(hits) / len(gt_set)


def mrr(retrieved_ids: List[str], ground_truth_ids: Set[str] | List[str]) -> float:
    """
    Tính Mean Reciprocal Rank (MRR): 1 / vị trí xuất hiện đầu tiên của tài liệu đúng.
    """
    if not ground_truth_ids or not retrieved_ids:
        return 0.0

    gt_set = set(ground_truth_ids)

    for rank, doc_id in enumerate(retrieved_ids):
        if doc_id in gt_set:
            return 1.0 / (rank + 1)

    return 0.0
