"""
Query Processor Orchestrator: Tích hợp Out-of-Scope Detector, Intent Classifier và NER Extractor.
"""
import logging
from nlu.schema import NLUResult
from nlu.intent_classifier import get_intent_classifier
from nlu.out_of_scope_detector import check_out_of_scope
from nlu.ner_extractor import get_ner_extractor

logger = logging.getLogger(__name__)


def process_query(query: str) -> NLUResult:
    """
    IPO Model:
    - Input: query (chuỗi câu hỏi đầu vào từ người dùng, ví dụ: 'Tư vấn laptop Asus RAM 16GB')
    - Process:
        Step 1: Kiểm tra trường hợp query rỗng hoặc khoảng trắng -> trả về default NLUResult
        Step 2: Gọi Out-of-Scope Detector để kiểm tra phạm vi câu hỏi và xác định Intent dự bộ
        Step 3: Gọi PhoBERT Intent Classifier lấy bảng điểm phân loại Intent đầy đủ
        Step 4: Gọi NER Extractor trích xuất danh sách thực thể (BRAND, PRICE, SPEC,...)
        Step 5: Tổng hợp thông tin tạo đối tượng NLUResult và ghi log
    - Output: NLUResult chứa intent, confidence, entities, intent_scores và is_out_of_scope
    """
    # Step 1: Kiểm tra chuỗi rỗng
    if not query or not query.strip():
        return NLUResult(
            original_query=query or "",
            intent="general_query",
            confidence=1.0,
            entities=[],
            intent_scores={"general_query": 1.0},
            is_out_of_scope=False,
        )

    # Step 2: Kiểm tra Out of Scope & Phân loại Intent cơ bản
    is_oos, intent, confidence = check_out_of_scope(query)

    # Step 3: Dự đoán điểm số Intent chi tiết từ PhoBERT / Fallback classifier
    classifier = get_intent_classifier()
    _, _, intent_scores = classifier.predict(query)

    # Step 4: Trích xuất các thực thể tên thương hiệu, giá cả, thông số bằng NER Extractor
    ner_extractor = get_ner_extractor()
    entities = ner_extractor.extract(query)

    # Step 5: Đóng gói toàn bộ kết quả vào NLUResult object
    result = NLUResult(
        original_query=query,
        intent=intent,
        confidence=confidence,
        entities=entities,
        intent_scores=intent_scores,
        is_out_of_scope=is_oos or (intent == "out_of_scope"),
    )

    # Step 6: Ghi thông vết Log và trả về kết quả
    logger.info(f"Processed NLU query='{query}' -> intent='{result.intent}', is_oos={result.is_out_of_scope}, entities={len(result.entities)}")
    return result

