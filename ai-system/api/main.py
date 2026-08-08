import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings
from api.routers import admin_products, chat, stage_testing, sync, admin_stats

settings = get_settings()

logging.basicConfig(level=settings.LOG_LEVEL)

app = FastAPI(
    title="ShopWise Ecommerce RAG Chatbot API",
    description="Hệ thống API RAG Chatbot tư vấn sản phẩm công nghệ và quản trị Admin.",
    version="1.0.0",
)

# Thêm CORS Middleware để kết nối mượt mà từ HTML Test Suite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_products.router)
app.include_router(chat.router)
app.include_router(stage_testing.router)
app.include_router(sync.router)
app.include_router(admin_stats.router)





@app.get("/health")
async def health_check():
    """
    IPO Model:
    - Input: None (HTTP GET request)
    - Process: Kiểm tra trạng thái hoạt động của hệ thống FastAPI server
    - Output: Dict {"status": "ok"}
    """
    # Step 1: Trả về dictionary xác nhận server đang chạy bình thường
    return {"status": "ok"}

