"""FastAPI application entry point."""
import sys
import os
import logging

# Fix Windows encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from config import get_settings
from routers import chat, sync, admin, health, rag_admin, conversations

settings = get_settings()
logging.basicConfig(level=settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    logging.info("Starting AI System v2.0...")
    # Load FAISS index on startup
    try:
        from core.retriever import load_index
        load_index()
    except Exception as e:
        logging.warning(f"Could not load index on startup: {e}")
    yield
    logging.info("Shutting down AI System...")


app = FastAPI(
    title="ShopWise RAG Chatbot API",
    description="Hệ thống RAG Chatbot tư vấn sản phẩm công nghệ.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(sync.router)
app.include_router(admin.router)
app.include_router(rag_admin.router)
app.include_router(conversations.router)


# Serve test UI
@app.get("/test")
async def test_ui():
    """Serve the test chat UI."""
    html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_chat.html")
    return FileResponse(html_path, media_type="text/html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)
