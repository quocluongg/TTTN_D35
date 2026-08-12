"""Centralized configuration from .env file."""
import os
from functools import lru_cache

from dotenv import load_dotenv

# Load .env from ai/ directory
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=_env_path, override=True)


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        # --- LLM ---
        self.GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        self.GEMINI_MODEL_NAME: str = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")
        self.LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))

        # --- Database (Supabase PostgreSQL) ---
        self.DB_HOST: str = os.getenv("DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com")
        self.DB_PORT: int = int(os.getenv("DB_PORT", "6543"))
        self.DB_NAME: str = os.getenv("DB_NAME", "postgres")
        self.DB_USER: str = os.getenv("DB_USER", "")
        self.DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

        # --- Embedding ---
        self.EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
        self.EMBEDDING_DEVICE: str = os.getenv("EMBEDDING_DEVICE", "cpu")
        self.EMBEDDING_BATCH_SIZE: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "16"))

        # --- Reranker ---
        self.RERANKER_MODEL: str = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
        self.RERANKER_DEVICE: str = os.getenv("RERANKER_DEVICE", "cpu")

        # --- Retrieval weights ---
        self.TOP_K: int = int(os.getenv("TOP_K", "20"))
        self.RERANK_TOP_K: int = int(os.getenv("RERANK_TOP_K", "5"))
        self.MMR_LAMBDA: float = float(os.getenv("MMR_LAMBDA", "0.7"))
        self.BM25_WEIGHT: float = float(os.getenv("BM25_WEIGHT", "0.50"))
        self.VECTOR_WEIGHT: float = float(os.getenv("VECTOR_WEIGHT", "0.30"))
        self.BUDGET_WEIGHT: float = float(os.getenv("BUDGET_WEIGHT", "0.10"))
        self.RATING_WEIGHT: float = float(os.getenv("RATING_WEIGHT", "0.10"))
        self.CE_WEIGHT: float = float(os.getenv("CE_WEIGHT", "0.60"))

        # --- NLU ---
        self.NLU_CONFIDENCE_THRESHOLD: float = float(os.getenv("NLU_CONFIDENCE_THRESHOLD", "0.45"))

        # --- Off-Topic Gate ---
        self.OFF_TOPIC_THRESHOLD: float = float(os.getenv("OFF_TOPIC_THRESHOLD", "0.48"))

        # --- Session ---
        self.SESSION_TTL: int = int(os.getenv("SESSION_TTL", "1800"))
        self.SESSION_MAX_TURNS: int = int(os.getenv("SESSION_MAX_TURNS", "6"))

        # --- Server ---
        self.HOST: str = os.getenv("HOST", "0.0.0.0")
        self.PORT: int = int(os.getenv("PORT", "8000"))


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
