"""
Module LLM Client quản lý tương tác với Large Language Models (Google GenAI API / Fallback RAG Engine).
"""

import os
import logging
from typing import List, Dict, Any, Optional
from chatbot.prompts import SYSTEM_PROMPT_ECOMMERCE_RAG, build_rag_user_prompt

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemma-4-31B-it")

class LLMClient:
    """LLM Client phục vụ sinh câu trả lời RAG Chatbot cho E-Commerce."""
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model_name or GEMINI_MODEL_NAME
        self.client = None

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logging.info(f"[LLMClient] Khởi tạo google-genai client với model '{self.model_name}' thành công!")
            except Exception as e:
                logging.warning(f"[LLMClient Warning] Không thể kết nối GenAI API ({e}). Sẽ sử dụng Grounded Template Generator.")

    def generate_rag_response(
        self,
        query: str,
        intent: str,
        entities: List[Dict[str, Any]],
        retrieved_context: List[Dict[str, Any]]
    ) -> str:
        """Sinh câu trả lời RAG từ Ngữ cảnh truy xuất và Ý định NLU."""

        user_prompt = build_rag_user_prompt(query, intent, entities, retrieved_context)

        # 1. Thử sinh qua GenAI API nếu đã khởi tạo
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=user_prompt,
                    config={
                        "system_instruction": SYSTEM_PROMPT_ECOMMERCE_RAG,
                    },
                )
                if response and hasattr(response, "text") and response.text.strip():
                    return response.text.strip()
            except Exception as e:
                logging.error(f"[LLMClient Error] Lỗi khi gọi GenAI API: {e}. Chuyển sang Fallback Generator.")

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
            return f"Dạ em chào anh/chị! Hiện tại hệ thống bên em chưa tìm thấy sản phẩm trùng khớp với yêu cầu \"{query}\". Anh/chị có thể cho em xin thêm khoảng ngân sách hoặc thương hiệu anh/chị đang quan tâm để em hỗ trợ tìm kiếm cho mình không ạ?"

        intent_lower = str(intent).lower()
        top_product = retrieved_context[0]
        p_name = top_product.get("name", "Sản phẩm")
        p_price = top_product.get("price", 0)
        p_price_str = f"{p_price:,.0f} VNĐ" if isinstance(p_price, (int, float)) and p_price > 0 else "Liên hệ báo giá"
        p_brand = top_product.get("brand", "")
        p_specs = top_product.get("specs", top_product.get("description", ""))
        p_specs_short = p_specs[:120] + "..." if len(p_specs) > 120 else p_specs

        if "compare" in intent_lower and len(retrieved_context) >= 2:
            p2 = retrieved_context[1]
            p2_name = p2.get("name", "Sản phẩm 2")
            p2_price = p2.get("price", 0)
            p2_price_str = f"{p2_price:,.0f} VNĐ" if isinstance(p2_price, (int, float)) and p2_price > 0 else "Liên hệ"
            p2_specs = p2.get("specs", p2.get("description", ""))
            p2_specs_short = p2_specs[:100] + "..." if len(p2_specs) > 100 else p2_specs
            
            res = f"Dạ em xin gửi anh/chị so sánh nhanh giữa **{p_name}** và **{p2_name}**:\n\n"
            res += f"1️⃣ **{p_name}**: Giá {p_price_str} ({p_brand}) - {p_specs_short}\n"
            res += f"2️⃣ **{p2_name}**: Giá {p2_price_str} - {p2_specs_short}\n\n"
            res += f"👉 **{p_name}** là lựa chọn rất đáng cân nhắc. Anh/chị có muốn em tư vấn chi tiết hơn sản phẩm nào không ạ?"
            return res

        elif "ask_price" in intent_lower or "price" in intent_lower:
            return f"Dạ, sản phẩm **{p_name}** ({p_brand}) hiện đang có giá niêm yết là **{p_price_str}** tại cửa hàng em ạ. Anh/chị có muốn em hỗ trợ lên đơn/đặt mua ngay không ạ?"

        elif "ask_specs" in intent_lower or "spec" in intent_lower:
            return f"Dạ em gửi anh/chị thông số nổi bật của **{p_name}** ({p_brand}):\n• **Giá bán:** {p_price_str}\n• **Cấu hình:** {p_specs_short}\n• **Đánh giá:** {top_product.get('rating', 4.8)}/5.0 ⭐\nAnh/chị cần em hỗ trợ xem thêm chi tiết điểm nào của máy không ạ?"

        else:
            res = f"Dạ với nhu cầu \"{query}\", em xin tư vấn cho anh/chị sản phẩm **{p_name}**"
            if p_brand: res += f" ({p_brand})"
            res += f":\n• **Giá bán:** {p_price_str}\n• **Thông số chính:** {p_specs_short}\n\n"
            if len(retrieved_context) > 1:
                res += f"Ngoài ra anh/chị có thể tham khảo thêm **{retrieved_context[1].get('name')}** (Giá: {retrieved_context[1].get('price', 0):,.0f} VNĐ).\n"
            res += "Anh/chị có muốn em hỗ trợ tư vấn sâu hơn hoặc đặt hàng không ạ?"
            return res
