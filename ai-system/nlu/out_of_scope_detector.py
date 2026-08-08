"""
Module phát hiện Out of Scope (OOS).
Mô hình souta04/phobert-electronics-e-commerce-nlu đã được train nhãn `out_of_scope` trực tiếp.
Module này cung cấp các kiểm tra bổ sung (confidence score, luật từ khóa ngoài phạm vi).
"""
import logging
from typing import Tuple

from nlu.intent_classifier import get_intent_classifier, CONFIDENCE_THRESHOLD

logger = logging.getLogger(__name__)


def check_out_of_scope(query: str) -> Tuple[bool, str, float]:
    """
    Kiểm tra xem câu hỏi có thuộc Out-of-Scope hay không.
    Trả về Tuple: (is_oos, predicted_intent, confidence)
    """
    classifier = get_intent_classifier()
    intent, confidence, _ = classifier.predict(query)

    # 1. Nếu mô hình phân loại trực tiếp là 'out_of_scope'
    if intent == "out_of_scope":
        return True, "out_of_scope", confidence

    # 2. Nếu độ tin cậy quá thấp
    if confidence < CONFIDENCE_THRESHOLD:
        return True, "out_of_scope", confidence

    # 3. Luật bổ sung: câu hỏi quá ngắn hoặc ký tự rác
    cleaned = query.strip()
    if len(cleaned) < 2:
        return True, "out_of_scope", 1.0

    return False, intent, confidence
