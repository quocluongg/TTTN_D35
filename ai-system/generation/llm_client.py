"""
LLM Client: Wrapper linh hoạt hỗ trợ nhiều provider (Google Gemini, OpenAI, Mock Fallback).
Cấu hình qua config/settings.py.
"""
import logging
import asyncio
from typing import Dict, Any

from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class LLMClient:
    def __init__(
        self,
        provider: str = settings.LLM_PROVIDER,
        model_name: str = settings.LLM_MODEL_NAME,
        api_key: str = settings.LLM_API_KEY,
        temperature: float = settings.LLM_TEMPERATURE,
    ):
        self.provider = provider.lower()
        self.model_name = model_name
        self.api_key = api_key
        self.temperature = temperature

    async def generate_response(self, prompt: str) -> str:
        """
        Gọi LLM bất đồng bộ để sinh câu trả lời.
        """
        if not prompt or not prompt.strip():
            return "Xin lỗi, không có thông tin truy vấn hợp lệ."

        if self.provider == "google" and self.api_key:
            return await self._generate_gemini(prompt)
        elif self.provider == "openai" and self.api_key:
            return await self._generate_openai(prompt)
        else:
            return await self._generate_mock(prompt)

    async def _generate_gemini(self, prompt: str) -> str:
        """Gọi Google Gemini API (google-generativeai)."""
        try:
            # pyrefly: ignore [missing-import]
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_name)
            
            loop = asyncio.get_running_loop()
            response = await loop.run_in_executor(
                None,
                lambda: model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(temperature=self.temperature)
                )
            )
            return response.text.strip()
        except Exception as e:
            logger.error(f"Lỗi khi gọi Google Gemini API ({e}), chuyển sang mock fallback.")
            return await self._generate_mock(prompt)

    async def _generate_openai(self, prompt: str) -> str:
        """Gọi OpenAI API."""
        try:
            # pyrefly: ignore [missing-import]
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            response = await client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=self.temperature,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Lỗi khi gọi OpenAI API ({e}), chuyển sang mock fallback.")
            return await self._generate_mock(prompt)

    async def _generate_mock(self, prompt: str) -> str:
        """
        Mock LLM Generator dùng khi chạy dev/testing hoặc chưa cấu hình API key.
        Dựa vào prompt để trả về phản hồi mô phỏng hợp lệ.
        """
        await asyncio.sleep(0.1)  # Giả lập I/O delay nhẹ

        if "THÔNG TIN THAM KHẢO (CONTEXT):\nKhông tìm thấy thông tin" in prompt:
            return (
                "Dạ xin lỗi quý khách, ShopWise hiện chưa có thông tin chi tiết về sản phẩm này "
                "trong cơ sở dữ liệu. Quý khách có thể để lại thông tin hoặc tham khảo các dòng sản phẩm khác ạ!"
            )

        if "CONTEXT - " in prompt:
            # Trích xuất đoạn context đầu tiên để mô phỏng phản hồi từ context
            start_idx = prompt.find("CONTEXT - ")
            snippet = prompt[start_idx:start_idx + 350]
            return (
                f"Dạ chào quý khách! Dựa trên thông tin hệ thống ShopWise:\n\n"
                f"{snippet}...\n\n"
                f"Nếu quý khách cần tư vấn thêm chi tiết hoặc hỗ trợ đặt hàng, đừng ngần ngại báo em nhé ạ!"
            )

        return "Chào mừng bạn đến với ShopWise! Bạn cần tư vấn thông tin về sản phẩm công nghệ nào ạ?"


_llm_client_instance = None


def get_llm_client() -> LLMClient:
    global _llm_client_instance
    if _llm_client_instance is None:
        _llm_client_instance = LLMClient()
    return _llm_client_instance
