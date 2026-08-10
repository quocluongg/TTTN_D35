"""
Config chung cho toàn bộ hệ thống.
Đọc từ biến môi trường (.env) để dễ deploy nhiều môi trường (dev/staging/prod).
"""
import os
from functools import lru_cache
from dotenv import load_dotenv

# Load .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(dotenv_path=env_path, override=True)

# Tự động hướng Hugging Face Cache về ổ D để tránh đầy ổ C
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS"] = "1"
if "HF_HOME" not in os.environ:
    os.environ["HF_HOME"] = "D:/huggingface_cache"
    os.environ["TRANSFORMERS_CACHE"] = "D:/huggingface_cache"



class Settings:
    # ---- Database ----
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_chatbot",
    )
    DB_HOST : str = os.getenv("DB_HOST", "aws-0-ap-southeast-1.pooler.supabase.com")
    DB_PORT : str = os.getenv("DB_PORT", "5432")
    DB_NAME : str = os.getenv("DB_NAME", "postgres")
    DB_USER : str = os.getenv("DB_USER", "postgres.zzukpubwbntihzztilqy")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

    # ---- Redis / Celery ----
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", REDIS_URL)
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

    # ---- Vector DB (Chroma) ----
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")
    CHROMA_COLLECTION_NAME: str = os.getenv("CHROMA_COLLECTION_NAME", "products")

    # ---- BM25 index ----
    BM25_INDEX_DIR: str = os.getenv("BM25_INDEX_DIR", "./bm25_data")

    # ---- Embedding model ----
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-m3")
    EMBEDDING_BATCH_SIZE: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "16"))
    EMBEDDING_DEVICE: str = os.getenv("EMBEDDING_DEVICE", "cpu")  # "cuda" nếu có GPU

    # ---- Chunking ----
    MAX_CHUNK_TOKENS: int = int(os.getenv("MAX_CHUNK_TOKENS", "400"))

    # ---- Reranker & Retrieval ----
    RERANKER_MODEL_NAME: str = os.getenv("RERANKER_MODEL_NAME", "BAAI/bge-reranker-v2-m3")
    RERANKER_DEVICE: str = os.getenv("RERANKER_DEVICE", "cpu")
    RRF_K: int = int(os.getenv("RRF_K", "60"))
    RETRIEVAL_TOP_K: int = int(os.getenv("RETRIEVAL_TOP_K", "20"))
    RERANK_TOP_K: int = int(os.getenv("RERANK_TOP_K", "5"))

    # ---- LLM Generation ----
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")  # "google", "openai", "mock"
    LLM_MODEL_NAME: str = os.getenv("LLM_MODEL_NAME", "gemini-1.5-flash")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))

    # ---- Security ----
    RAG_SYNC_API_KEY: str = os.getenv("RAG_SYNC_API_KEY", "default-dev-key")

    # ---- App ----
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", "8001"))
    APP_ENV: str = os.getenv("APP_ENV", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # ---- Legacy / Alias Compatibility ----
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("LLM_API_KEY", ""))
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL_NAME", "gemini-3.1-flash-lite"))
    FAISS_INDEX_PATH: str = os.getenv("FAISS_INDEX_PATH", "./faiss_store/index.faiss")
    BM25_INDEX_PATH: str = os.getenv("BM25_INDEX_PATH", "./faiss_store/bm25.pkl")
    TOP_K: int = int(os.getenv("TOP_K", "20"))
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-m3"))


@lru_cache
def get_settings() -> Settings:
    return Settings()

