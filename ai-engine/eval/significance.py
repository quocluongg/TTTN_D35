"""
Module kiểm định ý nghĩa thống kê (Statistical Significance Testing) chuẩn ITLR.
Hỗ trợ: Paired t-test, khoảng tin cậy 95% Confidence Interval, P-value.
"""

from typing import Dict, List, Tuple
import numpy as np
from scipy import stats


def paired_ttest(baseline_scores: List[float], proposed_scores: List[float]) -> Tuple[float, float]:
    """
    Thực hiện Paired t-test giữa điểm số Baseline và điểm số Mô hình Đề xuất.
    Trả về: (t_statistic, p_value)
    Nêu p_value < 0.05: Sự cải thiện có ý nghĩa thống kê thực sự (Statistically Significant).
    """
    b = np.asarray(baseline_scores, dtype=np.float64)
    p = np.asarray(proposed_scores, dtype=np.float64)
    
    if len(b) < 2 or len(p) < 2 or np.all(b == p):
        return 0.0, 1.0

    t_stat, p_val = stats.ttest_rel(p, b)
    return float(t_stat), float(p_val)


def confidence_interval_95(scores: List[float]) -> Tuple[float, float]:
    """Tính khoảng tin cậy 95% Confidence Interval (Mean - CI, Mean + CI)."""
    arr = np.asarray(scores, dtype=np.float64)
    if len(arr) < 2:
        mean_val = float(np.mean(arr)) if len(arr) > 0 else 0.0
        return mean_val, mean_val

    mean = float(np.mean(arr))
    sem = stats.sem(arr)
    margin = sem * stats.t.ppf((1 + 0.95) / 2.0, len(arr) - 1)
    return mean - margin, mean + margin
