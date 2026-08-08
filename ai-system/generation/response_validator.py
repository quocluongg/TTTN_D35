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
    IPO Model:
    - Input:
        - response: Chuỗi câu trả lời thô sinh ra từ mô hình ngôn ngữ LLM
        - context_docs: Danh sách các đoạn văn bản ngữ cảnh retrieved làm gốc
        - query: Câu hỏi truy vấn ban đầu (tùy chọn)
    - Process:
        Step 1: Kiểm tra phản hồi rỗng -> trả về ValidationResult thất bại ngay
        Step 2: Xử lý trường hợp context rỗng (nếu LLM từ chối lịch sự do thiếu thông tin -> hợp lệ)
        Step 3: Trích xuất danh sách con số (Numerical Check) trong response và đối chiếu với context gốc
        Step 4: Tính điểm độ trung thực Faithfulness Score dựa trên số từ ý nghĩa xuất hiện trong context
        Step 5: Đánh giá tổng thể is_valid (True nếu không sai lệch con số và Faithfulness Score >= 0.3)
    - Output: ValidationResult chứa is_valid, faithfulness_score, numerical_consistency, issues, sanitized_response
    """
    # Step 1: Kiểm tra phản hồi rỗng
    if not response or not response.strip():
        return ValidationResult(
            is_valid=False,
            faithfulness_score=0.0,
            numerical_consistency=False,
            issues=["Câu trả lời rỗng."],
            sanitized_response="Xin lỗi, không có câu trả lời phù hợp."
        )

    # Step 2: Xử lý trường hợp ngữ cảnh rỗng
    if not context_docs:
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

    # Step 3: Kiểm tra tính nhất quán số liệu (Numerical Consistency Check)
    response_numbers = set(NUMBER_PATTERN.findall(response))
    context_numbers = set(NUMBER_PATTERN.findall(combined_context))

    hallucinated_numbers = []
    for num in response_numbers:
        # Bỏ qua các số thứ tự 1-5 hoặc độ dài 1
        if len(num) == 1 and num in ["1", "2", "3", "4", "5"]:
            continue
        if num not in context_numbers:
            clean_num = num.replace(".", "").replace(",", "")
            if clean_num not in combined_context.replace(".", "").replace(",", ""):
                hallucinated_numbers.append(num)

    numerical_consistent = len(hallucinated_numbers) == 0
    if not numerical_consistent:
        issues.append(f"Phát hiện các con số/thông số không có trong Context: {', '.join(hallucinated_numbers)}")

    # Step 4: Tính điểm độ trung thực (Faithfulness Score) từ danh sách từ vựng
    words_in_response = set(re.findall(r'\b\w{3,}\b', response.lower()))
    if words_in_response:
        words_in_context = set(re.findall(r'\b\w{3,}\b', combined_context))
        stopwords = {"dạ", "chào", "quý", "khách", "hệ", "thống", "shopwise", "sản", "phẩm", "này", "được", "có", "là", "với", "cho", "bạn"}
        meaningful_words = words_in_response - stopwords

        if meaningful_words:
            supported_count = sum(1 for w in meaningful_words if w in words_in_context)
            faithfulness_score = supported_count / len(meaningful_words)
        else:
            faithfulness_score = 1.0
    else:
        faithfulness_score = 1.0

    # Step 5: Xác định kết quả kiểm định tổng thể hợp lệ hay không
    is_valid = (faithfulness_score >= 0.3) and numerical_consistent

    sanitized_response = response
    if not is_valid:
        logger.warning(f"Response validation FAILED: issues={issues}, faithfulness={faithfulness_score:.2f}")

    # Step 6: Đóng gói và trả về kết quả kiểm định
    return ValidationResult(
        is_valid=is_valid,
        faithfulness_score=faithfulness_score,
        numerical_consistency=numerical_consistent,
        issues=issues,
        sanitized_response=sanitized_response,
    )

