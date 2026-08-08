"""
Khởi tạo ứng dụng Celery Worker cho hệ thống RAG Ingestion.
"""
# pyrefly: ignore [missing-import]
from celery import Celery
from config.settings import get_settings

settings = get_settings()

celery_app = Celery(
    "ecommerce_chatbot_workers",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,
)
