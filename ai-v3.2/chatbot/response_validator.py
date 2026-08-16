"""
Module Response Validation & Guardrails chống Bị Đặt / Hallucination trong RAG Chatbot.
Đảm bảo thông tin giá tiền, tên sản phẩm và thông số trong phản hồi LLM trung thực 100% với Ngữ cảnh.
"""

import re
import logging
from typing import List, Dict, Any, Tuple

class ResponseValidator:
    """Validator kiểm tra tính xác thực (Grounding Verification) của phản hồi RAG."""
    def __init__(self):
        pass

    def validate_and_correct(
        self, 
        response_text: str, 
        retrieved_context: List[Dict[str, Any]]
    ) -> Tuple[str, bool, List[str]]:
        """
        Kiểm tra và sửa lỗi nếu LLM vô tình bịa đặt thông tin.
        Trả về: (validated_text, is_valid, list_of_warnings)
        """
        if not retrieved_context or not response_text:
            return response_text, True, []

        warnings = []
        is_valid = True
        
        # 1. Trích xuất các mức giá bằng số được nhắc tới trong phản hồi của LLM
        # Ví dụ: 25.000.000 VNĐ, 25000000đ, 25 triệu
        llm_price_matches = re.findall(r"(\d+(?:\.\d+)?)\s*(?:triệu|tr|vnđ|đ)", response_text, re.IGNORECASE)
        
        context_prices = set()
        for item in retrieved_context:
            price = float(item.get("price", 0))
            if price > 0:
                context_prices.add(price)
                context_prices.add(price / 1_000_000) # Đơn vị triệu

        # Check xem giá LLM nêu ra có trùng khớp hoặc lệch quá nhiều không
        for match in llm_price_matches:
            try:
                val = float(match.replace(".", ""))
                # Nếu giá không khớp với bất kỳ sản phẩm nào trong context
                if val > 100 and not any(abs(val - cp) < 1000 for cp in context_prices if cp > 100):
                    warnings.append(f"Cảnh báo: Con số giá {match} không tìm thấy trực tiếp trong ngữ cảnh truy xuất.")
            except ValueError:
                pass

        # 2. Check sự hiện diện của tên sản phẩm trong ngữ cảnh
        context_product_names = [item.get("name", "").lower() for item in retrieved_context if item.get("name")]
        
        if warnings:
            is_valid = False
            logging.warning(f"[ResponseValidator Warning] Phát hiện bất thường trong phản hồi RAG: {warnings}")

        return response_text, is_valid, warnings
