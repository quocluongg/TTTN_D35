"""LLM Client: Google Gemini API + template-based fallback.

Temperature bug fixed from v3 — actually passed to generate_content().
Streaming support added.
"""
import logging
from typing import Any, Dict, Generator, List, Optional

from ai.chatbot.prompts import SYSTEM_PROMPT, build_rag_user_prompt
from ai.config import get_settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Gemini LLM client with template fallback."""

    def __init__(self, settings=None):
        self.settings = settings or get_settings()
        self.client = None

        if self.settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai

                genai.configure(api_key=self.settings.GEMINI_API_KEY)
                self.client = genai.GenerativeModel(
                    model_name=self.settings.GEMINI_MODEL_NAME,
                    system_instruction=SYSTEM_PROMPT,
                )
                logger.info(f"[LLM] Gemini '{self.settings.GEMINI_MODEL_NAME}' initialized.")
            except Exception as e:
                logger.warning(f"[LLM] Cannot init Gemini ({e}). Using template fallback.")

    def generate(
        self, query: str, intent: str, entities: list, context: list, history_text: str = ""
    ) -> str:
        """Generate RAG response. Falls back to template if Gemini unavailable."""
        user_prompt = build_rag_user_prompt(query, intent, entities, context, history_text)

        if self.client:
            try:
                response = self.client.generate_content(
                    user_prompt,
                    generation_config={"temperature": self.settings.LLM_TEMPERATURE},
                )
                if response and hasattr(response, "text") and response.text.strip():
                    return response.text.strip()
            except Exception as e:
                logger.error(f"[LLM] Gemini error: {e}. Falling back to template.")

        return self._fallback(query, intent, context)

    def generate_stream(
        self, query: str, intent: str, entities: list, context: list, history_text: str = ""
    ) -> Generator[str, None, None]:
        """Stream RAG response chunks. Falls back to single template if unavailable."""
        user_prompt = build_rag_user_prompt(query, intent, entities, context, history_text)

        if self.client:
            try:
                stream = self.client.generate_content(
                    user_prompt,
                    generation_config={"temperature": self.settings.LLM_TEMPERATURE},
                    stream=True,
                )
                for chunk in stream:
                    if chunk.text:
                        yield chunk.text
                return
            except Exception as e:
                logger.error(f"[LLM] Gemini stream error: {e}. Falling back to template.")

        yield self._fallback(query, intent, context)

    def _fallback(self, query: str, intent: str, context: list) -> str:
        """Template-based response when Gemini unavailable."""
        intent_lower = str(intent).lower()

        if "greeting" in intent_lower:
            return (
                "Dạ em chào anh/chị ạ! Em là Nhân viên Tư vấn Bán hàng của ShopWise. "
                "Anh/chị đang cần tìm mua laptop, điện thoại hay phụ kiện công nghệ nào "
                "để em hỗ trợ cho mình ngay nhé ạ!"
            )

        if "complain" in intent_lower:
            return (
                "Dạ em vô cùng xin lỗi anh/chị vì sự cố sản phẩm khiến mình chưa hài lòng ạ! "
                "Anh/chị cho em xin thêm thông tin mã đơn hàng hoặc SĐT liên hệ để bộ phận "
                "Kỹ thuật & CSKH bên em hỗ trợ kiểm tra đổi trả / bảo hành ngay cho mình nhé ạ."
            )

        if "warranty" in intent_lower:
            return (
                "Dạ tất cả sản phẩm chính hãng tại ShopWise đều được bảo hành 12-24 tháng "
                "và hỗ trợ 1 đổi 1 trong 30 ngày đầu nếu có lỗi từ nhà sản xuất ạ. "
                "Anh/chị cần em hỗ trợ thông tin bảo hành cho sản phẩm cụ thể nào không ạ?"
            )

        if "promotion" in intent_lower:
            return (
                "Dạ hiện tại ShopWise đang có ưu đãi giảm giá lên đến 15% cùng nhiều quà tặng "
                "hấp dẫn khi mua sản phẩm công nghệ ạ. Anh/chị đang quan tâm mẫu nào "
                "để em báo giá ưu đãi tốt nhất cho mình ạ?"
            )

        if "order" in intent_lower:
            return (
                "Dạ anh/chị có thể bấm nút 'Thêm vào giỏ hàng' hoặc 'Mua ngay' ngay bên dưới "
                "sản phẩm để đặt hàng trực tiếp nhé ạ. Hoặc anh/chị để lại SĐT em sẽ liên hệ "
                "hỗ trợ lên đơn cho mình ạ!"
            )

        if "out_of_scope" in intent_lower:
            return (
                "Dạ xin lỗi anh/chị, em là AI chuyên tư vấn thiết bị công nghệ "
                "(Laptop, Điện thoại, Phụ kiện) của ShopWise nên chưa hỗ trợ câu hỏi ngoài "
                "phạm vi này ạ. Anh/chị cần em tư vấn sản phẩm nào cứ bảo em nhé ạ!"
            )

        if not context:
            return (
                f"Dạ em chào anh/chị! Hiện tại hệ thống bên em chưa tìm thấy sản phẩm "
                f"trùng khớp với yêu cầu \"{query}\". Anh/chị có thể cho em xin thêm "
                f"khoảng ngân sách hoặc thương hiệu đang quan tâm để em hỗ trợ tìm kiếm không ạ?"
            )

        top = context[0]
        name = top.get("name", "Sản phẩm")
        price = top.get("price", 0)
        price_str = f"{price:,.0f} VNĐ" if isinstance(price, (int, float)) and price > 0 else "Liên hệ"
        brand = top.get("brand", "")
        specs = top.get("specs", top.get("description", ""))[:120]

        if "compare" in intent_lower and len(context) >= 2:
            p2 = context[1]
            p2_name = p2.get("name", "Sản phẩm 2")
            p2_price = p2.get("price", 0)
            p2_str = f"{p2_price:,.0f} VNĐ" if isinstance(p2_price, (int, float)) and p2_price > 0 else "Liên hệ"
            return (
                f"Dạ em xin gửi anh/chị so sánh nhanh giữa **{name}** và **{p2_name}**:\n\n"
                f"1️⃣ **{name}**: Giá {price_str} ({brand})\n"
                f"2️⃣ **{p2_name}**: Giá {p2_str}\n\n"
                f"Anh/chị có muốn em tư vấn chi tiết hơn sản phẩm nào không ạ?"
            )

        if "price" in intent_lower:
            return (
                f"Dạ, sản phẩm **{name}** ({brand}) hiện đang có giá niêm yết là "
                f"**{price_str}** tại cửa hàng em ạ. "
                f"Anh/chị có muốn em hỗ trợ lên đơn/đặt mua ngay không ạ?"
            )

        if "specs" in intent_lower:
            return (
                f"Dạ em gửi anh/chị thông số nổi bật của **{name}** ({brand}):\n"
                f"• **Giá bán:** {price_str}\n"
                f"• **Cấu hình:** {specs}\n"
                f"• **Đánh giá:** {top.get('rating', 4.8)}/5.0 ⭐\n"
                f"Anh/chị cần em hỗ trợ xem thêm chi tiết điểm nào của máy không ạ?"
            )

        res = f"Dạ với nhu cầu của anh/chị, em xin tư vấn sản phẩm **{name}**"
        if brand:
            res += f" ({brand})"
        res += f":\n• **Giá bán:** {price_str}\n• **Thông số chính:** {specs}\n\n"
        if len(context) > 1:
            res += f"Ngoài ra anh/chị có thể tham khảo thêm **{context[1].get('name')}**.\n"
        res += "Anh/chị có muốn em hỗ trợ tư vấn sâu hơn hoặc đặt hàng không ạ?"
        return res
