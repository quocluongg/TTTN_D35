"""SHOPWISE AI Recommender & RAG Engine v3.2 - with pgvector, Linked Messages, RESTful Chat Routes & Admin Dashboard."""
import sys
import os
import time
import threading

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Query, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from core.db import get_db_connection, fetch_all_products
from core.retriever import Stage01Retriever
from core.pineline import RAGChatbotPipeline
from core.conversation_manager import get_conversation_manager
from nlu.phobert_nlu import PhoBERTElectronicsNLU
from nlu.schema import NLUResult
from db.models import ConversationCreateRequest, ConversationResponse, ChatRequest

# Admin routers
from admin import (
    stats_router,
    products_router,
    chunks_router,
    sync_router,
    config_router,
    logs_router,
    analytics_router,
)

load_dotenv()

app = FastAPI(
    title="SHOPWISE AI Recommender & RAG Engine",
    description="Microservice AI v3.2 with pgvector, 4-Stage Search, RAG Chatbot, Linked Messages & Admin Dashboard",
    version="3.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ INCLUDE ADMIN ROUTERS ============
app.include_router(stats_router)
app.include_router(products_router)
app.include_router(chunks_router)
app.include_router(sync_router)
app.include_router(config_router)
app.include_router(logs_router)
app.include_router(analytics_router)

# ============ STATIC FILES ============
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ============ GLOBAL INSTANCES ============
retriever_instance: Optional[Stage01Retriever] = None
nlu_engine_instance: Optional[PhoBERTElectronicsNLU] = None
rag_pipeline_instance: Optional[RAGChatbotPipeline] = None


def get_nlu_engine():
    global nlu_engine_instance
    if nlu_engine_instance is None:
        nlu_engine_instance = PhoBERTElectronicsNLU()
    return nlu_engine_instance


def get_retriever():
    global retriever_instance
    if retriever_instance is None:
        print("Loading products and initializing BM25 + pgvector + Reranker + MMR...")
        products = fetch_all_products()
        retriever_instance = Stage01Retriever(products, enable_stage2=True, enable_stage3=True)
        print(f"Retriever ready with {len(products)} products.")
    return retriever_instance


def get_rag_pipeline():
    global rag_pipeline_instance
    if rag_pipeline_instance is None:
        retriever = get_retriever()
        print("Initializing RAG Chatbot Pipeline v3.2 with Linked Messages...")
        rag_pipeline_instance = RAGChatbotPipeline(products=retriever.products)
        rag_pipeline_instance.retriever = retriever
        print("RAG Chatbot Pipeline v3.2 ready!")
    return rag_pipeline_instance


@app.on_event("startup")
def startup_event():
    """Background warmup on server start."""

    def _warmup():
        try:
            print("[Background Warmup] Loading Retriever and RAG Pipeline v3.2...")
            get_retriever()
            get_rag_pipeline()
            print("[Background Warmup] All AI Models ready!")
        except Exception as e:
            print(f"[Background Warmup Warning] {e}")

    threading.Thread(target=_warmup, daemon=True).start()


# ============ CORE ENDPOINTS ============


@app.get("/")
def root():
    return {
        "service": "SHOPWISE AI Recommender & RAG Engine",
        "version": "3.2.0",
        "status": "running",
        "features": [
            "PhoBERT Vietnamese NLU",
            "4-Stage Hybrid Search (BM25 + pgvector + Reranker + MMR)",
            "Product Recommender",
            "RAG Chatbot with Linked Messages & Parent Pointers (v3.2)",
            "Admin Dashboard at /admin",
            "Test Chat UI at /test",
        ],
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Check Supabase PostgreSQL connection."""
    start_time = time.time()
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM products;")
        cnt = cur.fetchone()[0]
        cur.close()
        conn.close()

        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "healthy",
            "database": "Supabase PostgreSQL (pgvector)",
            "total_products": cnt,
            "latency_ms": latency_ms,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ CONVERSATION ENDPOINTS (SUPPORT BOTH /chat/conversations & /api/v1/conversations) ============


@app.get("/chat/conversations")
@app.get("/api/v1/conversations")
def list_conversations(user_id: Optional[str] = Query(None)):
    """Lấy danh sách các Conversation thuộc về user_id."""
    cm = get_conversation_manager()
    return cm.list_conversations(user_id=user_id)


@app.post("/chat/conversations")
@app.post("/api/v1/conversations")

async def create_conversation_endpoint(
    request: Request,
    user_id: Optional[str] = Query(None)
):
    """Tạo một Conversation mới."""
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass

    title = body.get("title") or "Cuộc trò chuyện mới"
    uid = user_id or body.get("user_id")

    cm = get_conversation_manager()
    conv_id = cm.create_conversation(user_id=uid, title=title, metadata=body.get("metadata"))
    conv_obj = cm.get_conversation(conv_id)

    return {
        "id": conv_id,
        "conversation_id": conv_id,
        "title": title,
        "status": "ACTIVE",
        "started_at": conv_obj["started_at"] if conv_obj else "",
        "message": "Conversation created successfully"
    }


@app.get("/chat/conversations/{conversation_id}")
@app.get("/api/v1/conversations/{conversation_id}")

def get_conversation_details(conversation_id: str):
    """Lấy chi tiết Conversation và danh sách tất cả các tin nhắn có liên kết parent_id."""
    cm = get_conversation_manager()
    conv_data = cm.get_conversation(conversation_id)
    if not conv_data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv_data


@app.delete("/chat/conversations/{conversation_id}")
@app.delete("/api/v1/conversations/{conversation_id}")

def delete_conversation_endpoint(conversation_id: str):
    """Xóa một Conversation."""
    cm = get_conversation_manager()
    cm.delete_conversation(conversation_id)
    return {"success": True, "message": "Conversation deleted successfully"}


@app.get("/api/v1/conversations/{conversation_id}/history")
def get_conversation_history(
    conversation_id: str,
    last_message_id: Optional[str] = Query(None, description="Message ID nguồn để truy vết ngược"),
    max_turns: int = Query(10, ge=1, le=50)
):
    """Lấy chuỗi lịch sử tin nhắn liên kết tuyến tính (Linear Chain) từ last_message_id ngược về tin nhắn đầu."""
    cm = get_conversation_manager()
    history = cm.get_conversation_history(
        conversation_id=conversation_id,
        last_message_id=last_message_id,
        max_turns=max_turns
    )
    return {
        "conversation_id": conversation_id,
        "total_history_messages": len(history),
        "history": history
    }


# ============ CHAT ENDPOINTS (SUPPORT BOTH /chat & /api/v1/chat) ============


@app.post("/chat")
@app.get("/chat")
@app.post("/api/v1/chat")
@app.get("/api/v1/chat")
async def rag_chat_endpoint(
    request: Request,
    q: Optional[str] = Query(None, description="Câu hỏi hoặc yêu cầu tư vấn"),
    top_k: int = Query(5, ge=1, le=20, description="Số lượng sản phẩm ngữ cảnh"),
    conversation_id: Optional[str] = Query(None, description="ID cuộc trò chuyện"),
    parent_id: Optional[str] = Query(None, description="ID tin nhắn cha liền trước để liên kết"),
    user_id: Optional[str] = Query(None, description="ID người dùng")
):
    """RAG Chatbot 8-step pipeline with linked messages & Product Cards support."""
    try:
        from admin.logs import log_chat

        body = {}
        if request.method == "POST":
            try:
                body = await request.json()
            except Exception:
                pass

        query_text = q or body.get("query") or body.get("q")
        if not query_text or not str(query_text).strip():
            raise HTTPException(status_code=400, detail="Query text cannot be empty")

        conv_id = conversation_id or body.get("conversation_id")
        p_id = parent_id or body.get("parent_id")
        k_val = top_k or body.get("top_k", 5)

        pipeline = get_rag_pipeline()
        start = time.time()
        result = pipeline.process_query(
            query=str(query_text).strip(),
            top_k=k_val,
            conversation_id=conv_id,
            parent_id=p_id
        )
        latency_ms = int((time.time() - start) * 1000)

        # Log the interaction
        log_chat(
            query=str(query_text).strip(),
            intent=result.get("intent", "unknown"),
            confidence=result.get("confidence", 0),
            response=result.get("response") or result.get("answer", ""),
            sources=result.get("retrieved_products", []),
            latency_ms=latency_ms,
        )

        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG Chat error: {str(e)}")


# ============ SEARCH ENDPOINT ============


@app.get("/api/search")
def search_products(
    q: str = Query(..., description="Từ khóa hoặc nhu cầu tìm kiếm"),
    category: Optional[str] = Query(None),
    use_case: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    use_stage2: bool = Query(True),
    use_stage3: bool = Query(True),
    mmr_lambda: float = Query(0.7, ge=0.0, le=1.0),
    top_k: int = Query(10, ge=1, le=50),
):
    """4-Stage product search."""
    try:
        retriever = get_retriever()
        results = retriever.retrieve_and_rank(
            query=q,
            category=category,
            use_case=use_case,
            max_price=max_price,
            top_k=top_k,
            use_stage2=use_stage2,
            use_stage3=use_stage3,
            mmr_lambda=mmr_lambda,
        )
        return {
            "query": q,
            "filters": {
                "category": category,
                "use_case": use_case,
                "max_price": max_price,
            },
            "total_results": len(results),
            "products": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


# ============ NLU ENDPOINT ============


@app.get("/api/nlu/parse", response_model=NLUResult)
@app.post("/api/nlu/parse", response_model=NLUResult)
def parse_nlu_query(q: str = Query(..., description="Truy vấn cần phân tích NLU")):
    """Phân tích NLU tiếng Việt (PhoBERT)."""
    try:
        engine = get_nlu_engine()
        result = engine.parse(q)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLU error: {str(e)}")


# ============ SERVE UI PAGES ============


@app.get("/admin")
async def admin_dashboard():
    """Serve the admin dashboard UI."""
    html_path = os.path.join(static_dir, "admin.html")
    if os.path.exists(html_path):
        return FileResponse(html_path, media_type="text/html")
    return {"error": "admin.html not found"}


@app.get("/test")
async def test_chat_ui():
    """Serve the chatbot test UI."""
    html_path = os.path.join(static_dir, "test_chat.html")
    if os.path.exists(html_path):
        return FileResponse(html_path, media_type="text/html")
    return {"error": "test_chat.html not found"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
