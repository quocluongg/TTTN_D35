"""
Module LLM Client quản lý tương tác với Large Language Models (Google GenAI API / Gemma / Fallback RAG Engine).
"""

import os
import sys
import re
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


def _format_specs_to_bullets(specs: Any) -> str:
    """Tách thông số kỹ thuật thành từng dòng chấm đầu dòng ngắn gọn."""
    if isinstance(specs, dict):
        return "\n".join([f"  • {k}: {v}" for k, v in specs.items()])
    elif isinstance(specs, str) and specs.strip():
        parts = [p.strip() for p in re.split(r'[|;\n]', specs) if p.strip()]
        if len(parts) > 1:
            return "\n".join([f"  • {p}" for p in parts])
        return f"  • {specs.strip()}"
    return "  • Cấu hình chuẩn chính hãng"


def get_gemma_response(prompt: str, system_prompt: Optional[str] = None, model_name: str = DEFAULT_MODEL, api_key: Optional[str] = None) -> Optional[str]:
    """Gọi LLM sinh phản hồi văn bản đơn giản qua google-genai SDK mới."""
    key = api_key or GEMINI_API_KEY

    full_prompt = prompt
    if system_prompt:
        full_prompt = f"[SYSTEM]: {system_prompt}\n\n[USER]: {prompt}"

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
        retrieved_context: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Sinh câu trả lời RAG từ Ngữ cảnh truy xuất, Lịch sử liên kết và Ý định NLU."""

        user_prompt = build_rag_user_prompt(
            query=query,
            intent=intent,
            entities=entities,
            context_chunks=retrieved_context,
            conversation_history=conversation_history
        )

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
        return self._generate_fallback_grounded_response(query, intent, retrieved_context, conversation_history)

    def _generate_fallback_grounded_response(
        self,
        query: str,
        intent: str,
        retrieved_context: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Sinh phản hồi tổng hợp grounded chính xác dựa trên danh sách sản phẩm truy xuất và lịch sử."""
        if not retrieved_context:
            return f"Dạ chào anh/chị, hiện tại em chưa tìm thấy sản phẩm trùng khớp với yêu cầu \"{query}\". Anh/chị có thể cho em biết thêm khoảng giá hoặc thương hiệu yêu thích để em hỗ trợ tìm kiếm không ạ?"

        intent_lower = str(intent).lower()
        top_product = retrieved_context[0]
        p_name = top_product.get("name", "Sản phẩm")
        p_price = top_product.get("price", top_product.get("price_from", 0))
        p_price_str = f"{p_price:,.0f} VNĐ" if isinstance(p_price, (int, float)) and p_price > 0 else "Liên hệ báo giá"
        p_brand = top_product.get("brand", "")
        p_specs = top_product.get("specs", top_product.get("description", ""))
        bullets_specs = _format_specs_to_bullets(p_specs)

        if "compare" in intent_lower and len(retrieved_context) >= 2:
            p2 = retrieved_context[1]
            p2_name = p2.get("name", "Sản phẩm 2")
            p2_price = p2.get("price", p2.get("price_from", 0))
            p2_price_str = f"{p2_price:,.0f} VNĐ" if isinstance(p2_price, (int, float)) and p2_price > 0 else "Liên hệ"
            p2_bullets = _format_specs_to_bullets(p2.get("specs", p2.get("description", "")))

            res = f"Dạ, em xin gửi anh/chị thông số so sánh giữa **{p_name}** và **{p2_name}** ạ:\n\n"
            res += f"1️⃣ **{p_name}** (Giá: {p_price_str}):\n  • Hãng: {p_brand}\n{bullets_specs}\n\n"
            res += f"2️⃣ **{p2_name}** (Giá: {p2_price_str}):\n  • Hãng: {p2.get('brand', '')}\n{p2_bullets}\n\n"
            res += f"Anh/chị ưu tiên chọn sản phẩm nào để em tư vấn chi tiết hơn ạ?"
            return res

        elif "ask_price" in intent_lower or "price" in intent_lower:
            return f"Dạ, sản phẩm **{p_name}** ({p_brand}) đang có giá niêm yết chính thức là **{p_price_str}** tại cửa hàng ạ. Anh/chị có muốn đặt hàng ngay hay cần em hỗ trợ thêm thông số nào không ạ?"

        elif "ask_specs" in intent_lower or "spec" in intent_lower:
            res = f"Dạ, em xin gửi anh/chị các thông số kỹ thuật nổi bật của **{p_name}** ({p_brand}):\n"
            res += f"  • Giá bán: {p_price_str}\n"
            res += f"  • Đánh giá: {top_product.get('rating', top_product.get('rating_avg', 4.8))}/5.0 ⭐\n"
            res += f"{bullets_specs}\n"
            return res

        else:
            res = f"Dạ, với nhu cầu \"{query}\", em xin đề xuất cho anh/chị mẫu **{p_name}**"
            if p_brand: res += f" từ thương hiệu {p_brand}"
            res += f" ạ:\n\n  • **Giá bán:** {p_price_str}\n  • **Đánh giá:** {top_product.get('rating', top_product.get('rating_avg', 4.8))}/5.0 ⭐\n"
            res += f"  • **Thông số nổi bật:**\n{bullets_specs}\n\n"
            if len(retrieved_context) > 1:
                res += f"Ngoài ra, anh/chị cũng có thể tham khảo thêm mẫu **{retrieved_context[1].get('name')}** (Giá: {retrieved_context[1].get('price', 0):,.0f} VNĐ) ạ."
            return res
