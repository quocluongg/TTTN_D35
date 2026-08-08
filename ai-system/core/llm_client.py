"""Gemini LLM client."""
import sys
import os
import logging
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_settings

logger = logging.getLogger(__name__)

# Configure Gemini
try:
    import google.generativeai as genai
except ImportError:
    logger.warning("google-generativeai not installed. Install with: pip install google-generativeai")
    genai = None


def _configure_genai():
    """Configure Gemini with current settings."""
    if genai is not None:
        settings = get_settings()
        genai.configure(api_key=settings.GEMINI_API_KEY)
        return True
    return False


# Configure on import
_configure_genai()


async def generate_response(prompt: str) -> str:
    """Generate response using Gemini."""
    if not prompt or not prompt.strip():
        return "Xin lỗi, không có thông tin truy vấn hợp lệ."

    if genai is None:
        return "Gemini API không khả dụng. Vui lòng cài đặt google-generativeai."

    try:
        settings = get_settings()
        model = genai.GenerativeModel(settings.GEMINI_MODEL)

        # Run in executor to avoid blocking
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=settings.LLM_TEMPERATURE
                )
            )
        )
        return response.text.strip()

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau."


def test_connection() -> bool:
    """Test Gemini API connection."""
    if genai is None:
        return False

    try:
        _configure_genai()  # Reconfigure with latest settings
        settings = get_settings()
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content("Say OK")
        return "ok" in response.text.lower()
    except Exception as e:
        logger.error(f"Gemini connection test failed: {e}")
        return False
