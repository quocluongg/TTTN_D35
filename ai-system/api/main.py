import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings
# pyrefly: ignore [missing-import]
from api.routers import admin_products, chat, stage_testing

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





@app.get("/health")
async def health_check():
    return {"status": "ok"}
