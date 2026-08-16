"""
Module LLM Client quản lý tương tác với Large Language Models (Google GenAI API / Gemma / Fallback RAG Engine).
"""

import os
import sys
import logging
from typing import List, Dict, Any, Optional
from chatbot.prompts import SYSTEM_PROMPT_ECOMMERCE_RAG, build_rag_user_prompt

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

logger = logging.getLogger(__name__)

GEMINI_API_KEY = "<YOUR_KEY>"
DEFAULT_MODEL = "gemini-3.1-flash-lite"


def get_gemma_response(prompt: str, system_prompt: Optional[str] = None, model_name: str = DEFAULT_MODEL, api_key: Optional[str] = None) -> Optional[str]:
    """Gọi LLM sinh phản hồi văn bản đơn giản qua google-genai SDK mới.

    Args:
        prompt: Yêu cầu từ người dùng.
        system_prompt: Chỉ dẫn hệ thống (tùy chọn).
        model_name: Tên mô hình (mặc định: gemini-3.1-flash-lite).
        api_key: Gemini/Gemma API Key.

    Returns:
        Câu trả lời văn bản sinh ra từ LLM hoặc None nếu thất bại.
    """
    key = api_key or GEMINI_API_KEY

    full_prompt = prompt
    if system_prompt:
        full_prompt = f"[SYSTEM]: {system_prompt}\n\n[USER]: {prompt}"

    # 1. dùng google-genai SDK mới
    try:
        from google import genai
        client = genai.Client(api_key=key) if key else genai.Client()
        response = client.models.generate_content(
            model=model_name,
            contents=full_prompt,
        )
        if response and hasattr(response, "text") and response.text:
            return response.text.strip()
    except Exception as e1:
        logger.debug(f"[google-genai error] {e1}")

    return None


class LLMClient:
    """LLM Client phục vụ sinh câu trả lời RAG Chatbot cho E-Commerce."""
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model_name or DEFAULT_MODEL
        self.client = None

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"[LLMClient] Khởi tạo google-genai client với model '{self.model_name}' thành công!")
            except Exception as e:
                logger.warning(f"[LLMClient Warning] Không thể kết nối GenAI API ({e}). Sẽ sử dụng Grounded Template Generator.")

    def generate_rag_response(
        self,
        query: str,
        intent: str,
        entities: List[Dict[str, Any]],
        retrieved_context: List[Dict[str, Any]]
    ) -> str:
        """Sinh câu trả lời RAG từ Ngữ cảnh truy xuất và Ý định NLU."""

        user_prompt = build_rag_user_prompt(query, intent, entities, retrieved_context)

        # 1. Thử sinh qua google-genai SDK mới
        response_text = get_gemma_response(
            prompt=user_prompt,
            system_prompt=SYSTEM_PROMPT_ECOMMERCE_RAG,
            model_name=self.model_name,
            api_key=self.api_key
        )

        if response_text:
            return response_text

        # 2. Fallback Generator (Sinh câu trả lời grounded chuẩn xác không cần API key)
        return self._generate_fallback_grounded_response(query, intent, retrieved_context)

    def _generate_fallback_grounded_response(
        self,
        query: str,
        intent: str,
        retrieved_context: List[Dict[str, Any]]
    ) -> str:
        """Sinh phản hồi tổng hợp grounded chính xác dựa trên danh sách sản phẩm truy xuất."""
        if not retrieved_context:
            return f"Chào bạn! Hiện tại hệ thống chưa tìm thấy sản phẩm trùng khớp với yêu cầu \"{query}\". Bạn có thể cho mình biết thêm khoảng giá hoặc thương hiệu yêu thích để mình hỗ trợ tìm kiếm không ạ?"

        intent_lower = str(intent).lower()
        top_product = retrieved_context[0]
        p_name = top_product.get("name", "Sản phẩm")
        p_price = top_product.get("price", 0)
        p_price_str = f"{p_price:,.0f} VNĐ" if isinstance(p_price, (int, float)) and p_price > 0 else "Liên hệ báo giá"
        p_brand = top_product.get("brand", "")
        p_specs = top_product.get("specs", top_product.get("description", ""))

        if "compare" in intent_lower and len(retrieved_context) >= 2:
            p2 = retrieved_context[1]
            p2_name = p2.get("name", "Sản phẩm 2")
            p2_price = p2.get("price", 0)
            p2_price_str = f"{p2_price:,.0f} VNĐ" if isinstance(p2_price, (int, float)) and p2_price > 0 else "Liên hệ"

            res = f"Dạ, mình xin gửi bạn so sánh giữa **{p_name}** và **{p2_name}**:\n\n"
            res += f"1️⃣ **{p_name}**:\n   • Hãng: {p_brand}\n   • Giá bán: {p_price_str}\n   • Cấu hình: {p_specs}\n\n"
            res += f"2️⃣ **{p2_name}**:\n   • Hãng: {p2.get('brand', '')}\n   • Giá bán: {p2_price_str}\n   • Cấu hình: {p2.get('specs', '')}\n\n"
            res += f"👉 Nếu bạn ưu tiên phân khúc {p_brand}, **{p_name}** là lựa chọn rất đáng cân nhắc!"
            return res

        elif "ask_price" in intent_lower or "price" in intent_lower:
            return f"Dạ, sản phẩm **{p_name}** ({p_brand}) đang có giá bán niêm yết là **{p_price_str}** tại cửa hàng ạ. Bạn có muốn đặt mua hay cần tư vấn thêm thông số kỹ thuật không ạ?"

        elif "ask_specs" in intent_lower or "spec" in intent_lower:
            return f"Dạ, về thông số kỹ thuật của **{p_name}** ({p_brand}):\n• **Giá bán:** {p_price_str}\n• **Thông số nổi bật:** {p_specs}\n• **Đánh giá:** {top_product.get('rating', 4.8)}/5.0 ⭐"

        else:
            res = f"Dạ, dựa trên yêu cầu \"{query}\", mình xin tư vấn cho bạn sản phẩm phù hợp nhất là **{p_name}**"
            if p_brand: res += f" đến từ hãng {p_brand}"
            res += f":\n\n• **Giá bán:** {p_price_str}\n• **Đánh giá:** {top_product.get('rating', 4.8)}/5.0 ⭐\n• **Thông số / Ưu điểm:** {p_specs}\n\n"
            if len(retrieved_context) > 1:
                res += f"Ngoài ra, bạn cũng có thể tham khảo thêm **{retrieved_context[1].get('name')}** (Giá: {retrieved_context[1].get('price', 0):,.0f} VNĐ)."
            return res


if __name__ == "__main__":
    test_prompt = "Xin chào, hãy giới thiệu ngắn gọn về bản thân bạn."
    print("=" * 60)
    print(f"Testing LLM Client ({DEFAULT_MODEL})...")
    print("=" * 60)
    print(f"Prompt: {test_prompt}\n")
    output = get_gemma_response(test_prompt) or f"[LLMClient] Chưa phát hiện API Key hoặc SDK. Đã sẵn sàng kết nối model '{DEFAULT_MODEL}'!"
    print(f"Response:\n{output}")
