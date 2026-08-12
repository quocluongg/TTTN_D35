"""AI v4 — E-commerce RAG Chatbot. FastAPI entry point."""
import logging
import os
import sys
import threading

# Ensure ai/ is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from ai.api.server import router as api_router
from ai.config import get_settings

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")

# Settings
settings = get_settings()

# App
app = FastAPI(
    title="SHOPWISE AI v4",
    description="E-commerce RAG Chatbot with PhoBERT NLU, 4-Stage Retrieval, Streaming",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_router)

# Admin routes
from ai.admin import (
    analytics_router,
    chunks_router,
    config_router,
    logs_router,
    products_router,
    stats_router,
    sync_router,
)

app.include_router(stats_router)
app.include_router(products_router)
app.include_router(chunks_router)
app.include_router(sync_router)
app.include_router(config_router)
app.include_router(logs_router)
app.include_router(analytics_router)

# Static files
_static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(_static_dir):
    app.mount("/static", StaticFiles(directory=_static_dir), name="static")


# ============ ENGINE INITIALIZATION ============

from ai.engine import Engine

app.state.engine = Engine(settings)


@app.on_event("startup")
def startup():
    """Background warmup."""
    def _warmup():
        try:
            app.state.engine._warmup()
        except Exception as e:
            logging.error(f"[Startup] Warmup failed: {e}")

    threading.Thread(target=_warmup, daemon=True).start()


@app.get("/")
def root():
    return {
        "service": "SHOPWISE AI v4",
        "version": "4.0.0",
        "status": "running",
        "features": [
            "PhoBERT Vietnamese NLU",
            "4-Stage Hybrid Search (BM25 + pgvector + Reranker + MMR)",
            "SSE Streaming Chat",
            "Multi-Intent Handling",
            "Off-Topic Gating",
            "Conversation Memory",
            "Admin Dashboard at /admin",
        ],
        "docs": "/docs",
    }


@app.get("/admin")
async def admin_dashboard():
    html_path = os.path.join(_static_dir, "admin.html")
    if os.path.exists(html_path):
        return FileResponse(html_path, media_type="text/html")
    return {"error": "admin.html not found"}


@app.get("/test")
async def test_chat_ui():
    html_path = os.path.join(_static_dir, "test_chat.html")
    if os.path.exists(html_path):
        return FileResponse(html_path, media_type="text/html")
    return {"error": "test_chat.html not found"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.main:app", host=settings.HOST, port=settings.PORT, reload=True)
