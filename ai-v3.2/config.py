"""Configuration from environment variables."""
import os
from functools import lru_cache
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=env_path, override=True)


class Settings:
    """Application settings from .env file."""

    def __init__(self):
        # App
        self.APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
        self.APP_PORT = int(os.getenv("APP_PORT", "8000"))
        self.APP_ENV = os.getenv("APP_ENV", "development")
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

        # Supabase PostgreSQL
        self.DB_HOST = os.getenv("DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com")
        self.DB_PORT = int(os.getenv("DB_PORT", "5432"))
        self.DB_NAME = os.getenv("DB_NAME", "postgres")
        self.DB_USER = os.getenv("DB_USER", "postgres.zzukpubwbntihzztilqy")
        self.DB_PASSWORD = os.getenv("DB_PASSWORD", "")

        # Embedding
        self.EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
        self.EMBEDDING_DEVICE = os.getenv("EMBEDDING_DEVICE", "cpu")
        self.EMBEDDING_BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "16"))

        # Reranker
        self.RERANKER_MODEL = os.getenv("RERANKER_MODEL", "BAAI/bge-reranker-v2-m3")
        self.RERANKER_DEVICE = os.getenv("RERANKER_DEVICE", "cpu")

        # Retrieval
        self.TOP_K = int(os.getenv("TOP_K", "20"))
        self.RERANK_TOP_K = int(os.getenv("RERANK_TOP_K", "5"))
        self.MMR_LAMBDA = float(os.getenv("MMR_LAMBDA", "0.7"))

        # LLM
        self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "<YOUR_KEY>")
        self.GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemma-4-31b-it")
        self.LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.2"))

        # NLU
        self.NLU_CONFIDENCE_THRESHOLD = float(os.getenv("NLU_CONFIDENCE_THRESHOLD", "0.45"))


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
