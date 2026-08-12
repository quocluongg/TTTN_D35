"""
Module LLM Client quản lý tương tác với Large Language Models (Google Gemini API / Fallback RAG Engine).
"""

import os
import logging
from typing import List, Dict, Any, Optional
from chatbot.prompts import SYSTEM_PROMPT_ECOMMERCE_RAG, build_rag_user_prompt

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")

class LLMClient:
    """LLM Client phục vụ sinh câu trả lời RAG Chatbot cho E-Commerce."""
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model_name or GEMINI_MODEL_NAME
        self.client = None
        
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=SYSTEM_PROMPT_ECOMMERCE_RAG
                )
                logging.info(f"[LLMClient] Khởi tạo Gemini Model '{self.model_name}' thành công!")
            except Exception as e:
                logging.warning(f"[LLMClient Warning] Không thể kết nối Gemini API ({e}). Sẽ sử dụng Grounded Template Generator.")

    def generate_rag_response(
        self, 
        query: str, 
        intent: str, 
        entities: List[Dict[str, Any]], 
        retrieved_context: List[Dict[str, Any]]
    ) -> str:
        """Sinh câu trả lời RAG từ Ngữ cảnh truy xuất và Ý định NLU."""
        
        user_prompt = build_rag_user_prompt(query, intent, entities, retrieved_context)
        
        # 1. Thử sinh qua Gemini API nếu đã khởi tạo
        if self.client:
            try:
                response = self.client.generate_content(user_prompt)
                if response and hasattr(response, "text") and response.text.strip():
                    return response.text.strip()
            except Exception as e:
                logging.error(f"[LLMClient Error] Lỗi khi gọi Gemini API: {e}. Chuyển sang Fallback Generator.")

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
