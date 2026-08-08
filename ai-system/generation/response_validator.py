"""
Response Validator: Kiểm tra chống hallucination cho câu trả lời của LLM.
Thực hiện:
1. Faithfulness Check (kiểm tra từ khóa / nội dung chính có được hỗ trợ bởi Context).
2. Numerical Check (đối chiếu tất cả các con số, giá tiền, dung lượng trong response với Context gốc).
"""
import re
import logging
from dataclasses import dataclass, field
from typing import List

from retrieval.hybrid_retriever import RetrievedDocument

logger = logging.getLogger(__name__)

# Regex trích xuất tất cả các chuỗi số (ví dụ: 25.000.000, 16GB, 512, 120Hz, 4060)
NUMBER_PATTERN = re.compile(r'\b\d+(?:[\.,]\d+)*\b')


@dataclass
class ValidationResult:
    is_valid: bool
    faithfulness_score: float
    numerical_consistency: bool
    issues: List[str] = field(default_factory=list)
    sanitized_response: str = ""


def validate_response(
    response: str,
    context_docs: List[RetrievedDocument],
    query: str = "",
) -> ValidationResult:
    """
    Kiểm tra tính trung thực và chính xác của câu trả lời LLM đối chiếu với Context gốc.
    """
    if not response or not response.strip():
        return ValidationResult(
            is_valid=False,
            faithfulness_score=0.0,
            numerical_consistency=False,
            issues=["Câu trả lời rỗng."],
            sanitized_response="Xin lỗi, không có câu trả lời phù hợp."
        )

    # Nếu context_docs rỗng
    if not context_docs:
        # Nếu LLM lịch sự từ chối trả lời do thiếu thông tin -> Hợp lệ
        if "không có" in response.lower() or "chưa có" in response.lower() or "xin lỗi" in response.lower():
            return ValidationResult(
                is_valid=True,
                faithfulness_score=1.0,
                numerical_consistency=True,
                issues=[],
                sanitized_response=response,
            )

    combined_context = "\n".join([doc.text for doc in context_docs]).lower()
    issues: List[str] = []

    # 1. Numerical Consistency Check (Kiểm tra con số)
    response_numbers = set(NUMBER_PATTERN.findall(response))
    context_numbers = set(NUMBER_PATTERN.findall(combined_context))

    hallucinated_numbers = []
    for num in response_numbers:
        # Bỏ qua các số thứ tự đơn giản (1, 2, 3) hoặc độ dài 1 ký tự
        if len(num) == 1 and num in ["1", "2", "3", "4", "5"]:
            continue
        if num not in context_numbers:
            # Kiểm tra định dạng số bỏ bớt dấu chấm/phẩy
            clean_num = num.replace(".", "").replace(",", "")
            if clean_num not in combined_context.replace(".", "").replace(",", ""):
                hallucinated_numbers.append(num)

    numerical_consistent = len(hallucinated_numbers) == 0
    if not numerical_consistent:
        issues.append(f"Phát hiện các con số/thông số không có trong Context: {', '.join(hallucinated_numbers)}")

    # 2. Faithfulness Score (Tỷ lệ tương đồng từ khoá chính)
    words_in_response = set(re.findall(r'\b\w{3,}\b', response.lower()))
    if words_in_response:
        words_in_context = set(re.findall(r'\b\w{3,}\b', combined_context))
        # Từ dừng tiếng Việt cơ bản
        stopwords = {"dạ", "chào", "quý", "khách", "hệ", "thống", "shopwise", "sản", "phẩm", "này", "được", "có", "là", "với", "cho", "bạn"}
        meaningful_words = words_in_response - stopwords

        if meaningful_words:
            supported_count = sum(1 for w in meaningful_words if w in words_in_context)
            faithfulness_score = supported_count / len(meaningful_words)
        else:
            faithfulness_score = 1.0
    else:
        faithfulness_score = 1.0

    is_valid = (faithfulness_score >= 0.3) and numerical_consistent

    sanitized_response = response
    if not is_valid:
        logger.warning(f"Response validation FAILED: issues={issues}, faithfulness={faithfulness_score:.2f}")

    return ValidationResult(
        is_valid=is_valid,
        faithfulness_score=faithfulness_score,
        numerical_consistency=numerical_consistent,
        issues=issues,
        sanitized_response=sanitized_response,
    )
