"""
Module tính toán các chỉ số Beyond-Accuracy & Diversity (Độ đa dạng & Bao phủ) chuẩn ITLR.
Hỗ trợ:
- Intra-List Diversity (ILD): Độ đa dạng thuộc tính giữa các item trong danh sách gợi ý.
- Catalog Coverage: Tỷ lệ % toàn bộ kho sản phẩm được hệ thống gợi ý.
"""

from typing import List, Dict, Any, Set
import numpy as np

def jaccard_distance(set_a: Set[str], set_b: Set[str]) -> float:
    """Khoảng cách Jaccard (1 - Jaccard Similarity)."""
    if not set_a or not set_b:
        return 1.0
    union = set_a | set_b
    if not union:
        return 1.0
    similarity = len(set_a & set_b) / len(union)
    return 1.0 - similarity


def intra_list_diversity(items: List[Dict[str, Any]]) -> float:
    """
    Tính Intra-List Diversity (ILD) dựa trên khoảng cách thuộc tính giữa từng cặp item.
    Giá trị càng gần 1.0 tức danh sách gợi ý càng đa dạng, không bị trùng lặp lặt vặt.
    """
    n = len(items)
    if n <= 1:
        return 0.0

    distances = []
    for i in range(n):
        specs_i = set(str(items[i].get("specs", "") or "").lower().split())
        category_i = str(items[i].get("category", "") or "").lower()
        if category_i:
            specs_i.add(category_i)

        for j in range(i + 1, n):
            specs_j = set(str(items[j].get("specs", "") or "").lower().split())
            category_j = str(items[j].get("category", "") or "").lower()
            if category_j:
                specs_j.add(category_j)

            dist = jaccard_distance(specs_i, specs_j)
            distances.append(dist)

    return float(np.mean(distances)) if distances else 0.0


def catalog_coverage(recommended_item_ids: Set[str], total_catalog_size: int) -> float:
    """Tính tỷ lệ bao phủ Catalog Coverage (số item duy nhất được gợi ý / tổng kho sản phẩm)."""
    if total_catalog_size <= 0:
        return 0.0
    return len(recommended_item_ids) / float(total_catalog_size)
