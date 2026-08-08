"""
Evaluation Module: Đánh giá chất lượng của câu trả lời do LLM sinh ra (Generation Metrics).
Các chỉ số: Faithfulness Score (Độ trung thực so với Context) và Relevance Score (Độ liên quan tới Query).
"""
import re
from typing import List


def compute_faithfulness_score(response: str, context_texts: List[str]) -> float:
    """
    Tính điểm Faithfulness: Tỷ lệ từ khóa có ý nghĩa trong câu trả lời xuất hiện trong đoạn Context.
    """
    if not response or not context_texts:
        return 0.0

    combined_context = " ".join(context_texts).lower()
    response_words = set(re.findall(r'\b\w{3,}\b', response.lower()))

    stopwords = {"dạ", "chào", "quý", "khách", "hệ", "thống", "shopwise", "sản", "phẩm", "này", "được", "có", "là", "với", "cho", "bạn"}
    meaningful_words = response_words - stopwords

    if not meaningful_words:
        return 1.0

    supported = sum(1 for w in meaningful_words if w in combined_context)
    return supported / len(meaningful_words)


def compute_relevance_score(response: str, query: str) -> float:
    """
    Tính điểm Relevance: Độ liên quan từ vựng giữa câu trả lời và câu hỏi ban đầu.
    """
    if not response or not query:
        return 0.0

    query_words = set(re.findall(r'\b\w{3,}\b', query.lower()))
    response_words = set(re.findall(r'\b\w{3,}\b', response.lower()))

    stopwords = {"hỏi", "cho", "xin", "giá", "là", "bao", "nhiêu", "nào", "gì", "thế", "có"}
    key_query_words = query_words - stopwords

    if not key_query_words:
        return 1.0

    overlap = key_query_words.intersection(response_words)
    return len(overlap) / len(key_query_words)
