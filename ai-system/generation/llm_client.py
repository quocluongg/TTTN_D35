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
        IPO Model:
        - Input: prompt (chuỗi Prompt chứa System instructions, Context và User query)
        - Process:
            Step 1: Kiểm tra prompt rỗng -> trả về câu thông báo mặc định
            Step 2: Điều hướng tới _generate_gemini nếu provider là 'google' và có api_key
            Step 3: Điều hướng tới _generate_openai nếu provider là 'openai' và có api_key
            Step 4: Mặc định rơi vào _generate_mock nếu chạy dev/testing hoặc chưa cấu hình API key
        - Output: Chuỗi phản hồi văn bản sinh ra từ LLM
        """
        # Step 1: Kiểm tra prompt không được rỗng
        if not prompt or not prompt.strip():
            return "Xin lỗi, không có thông tin truy vấn hợp lệ."

        # Step 2: Điều hướng provider theo cấu hình
        if self.provider == "google" and self.api_key:
            return await self._generate_gemini(prompt)
        elif self.provider == "openai" and self.api_key:
            return await self._generate_openai(prompt)
        else:
            return await self._generate_mock(prompt)

    async def _generate_gemini(self, prompt: str) -> str:
        """
        IPO Model:
        - Input: prompt (chuỗi Prompt)
        - Process:
            Step 1: Khởi tạo mô hình Google Gemini GenerativeModel
            Step 2: Chạy generate_content trong executor để tránh block event loop
            Step 3: Bắt lỗi nếu API gặp sự cố -> tự động chuyển sang mock fallback
        - Output: Chuỗi câu trả lời từ Google Gemini API
        """
        try:
            # Step 1: Import và cấu hình API Key
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_name)
            
            # Step 2: Gọi SDK bất đồng bộ qua thread pool executor
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
            # Step 3: Xử lý ngoại lệ và chuyển sang mock mode khi lỗi
            logger.error(f"Lỗi khi gọi Google Gemini API ({e}), chuyển sang mock fallback.")
            return await self._generate_mock(prompt)

    async def _generate_openai(self, prompt: str) -> str:
        """
        IPO Model:
        - Input: prompt (chuỗi Prompt)
        - Process:
            Step 1: Khởi tạo AsyncOpenAI client
            Step 2: Gọi chat.completions.create bất đồng bộ
            Step 3: Bắt lỗi và chuyển sang mock fallback nếu thất bại
        - Output: Chuỗi câu trả lời từ OpenAI API
        """
        try:
            # Step 1: Khởi tạo AsyncOpenAI Client
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)

            # Step 2: Gửi câu lệnh chat completion
            response = await client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=self.temperature,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            # Step 3: Xử lý fallback khi có sự cố
            logger.error(f"Lỗi khi gọi OpenAI API ({e}), chuyển sang mock fallback.")
            return await self._generate_mock(prompt)

    async def _generate_mock(self, prompt: str) -> str:
        """
        IPO Model:
        - Input: prompt (chuỗi Prompt)
        - Process:
            Step 1: Giả lập độ trễ I/O nhẹ 100ms
            Step 2: Phân tích các từ khóa có trong prompt (ví dụ: 'không tìm thấy' hay 'CONTEXT - ')
            Step 3: Trích xuất đoạn văn bản tiêu biểu từ CONTEXT để trả về phản hồi mô phỏng chính xác
        - Output: Chuỗi câu trả lời mô phỏng cho môi trường Dev / Testing
        """
        # Step 1: Giả lập trễ mạng
        await asyncio.sleep(0.1)

        # Step 2: Phân tích nếu không có ngữ cảnh phù hợp
        if "THÔNG TIN THAM KHẢO (CONTEXT):\nKhông tìm thấy thông tin" in prompt:
            return (
                "Dạ xin lỗi quý khách, ShopWise hiện chưa có thông tin chi tiết về sản phẩm này "
                "trong cơ sở dữ liệu. Quý khách có thể để lại thông tin hoặc tham khảo các dòng sản phẩm khác ạ!"
            )

        # Step 3: Phân tích và trích xuất ngữ cảnh nếu có dữ liệu
        if "CONTEXT - " in prompt:
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
    """
    IPO Model:
    - Input: None
    - Process: Kiểm tra và khởi tạo Singleton instance cho LLMClient
    - Output: Đối tượng LLMClient dùng chung cho toàn hệ thống
    """
    # Step 1: Kiểm tra biến toàn cục _llm_client_instance
    global _llm_client_instance
    if _llm_client_instance is None:
        # Step 2: Khởi tạo mới nếu chưa tồn tại
        _llm_client_instance = LLMClient()
    # Step 3: Trả về instance duy nhất
    return _llm_client_instance

