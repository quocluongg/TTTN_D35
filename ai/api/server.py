"""FastAPI routes: chat, search, NLU, health, streaming."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api")


def _get_engine():
    """Get engine from app state."""
    from ai.main import app
    engine = getattr(app.state, "engine", None)
    if engine is None:
        raise RuntimeError("Engine not initialized")
    return engine


# ============ CHAT ============


@router.post("/v1/chat")
@router.get("/v1/chat")
def chat(
    q: str = Query(..., description="User query"),
    session_id: Optional[str] = Query(None, description="Session ID for conversation memory"),
    top_k: int = Query(5, ge=1, le=20),
    user_id: Optional[str] = Query(None, description="Authenticated user profile ID"),
):
    """Full RAG chat endpoint."""
    try:
        engine = _get_engine()
        if not engine.is_ready:
            raise HTTPException(status_code=503, detail="Engine warming up...")
        response = engine.chat(q, session_id=session_id)
        _persist_chat(session_id, user_id, q, response)
        return response
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Engine warming up...")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _persist_chat(session_id: Optional[str], user_id: Optional[str], query: str, response: dict):
    """Persist a chat turn (user + assistant message + recommended events) to DB."""
    if not session_id:
        return
    try:
        from ai.core.db import ensure_conversation, insert_chat_message, log_conversion_event
        conversation_id = ensure_conversation(session_id, user_id=user_id)
        if not conversation_id:
            return

        insert_chat_message(conversation_id, "USER", query, latency_ms=0)

        answer = response.get("answer", "")
        intent = response.get("intent")
        confidence = response.get("confidence")
        product_ids = [
            str(p.get("id")) for p in response.get("retrieved_products", [])
            if p.get("id")
        ]

        import time as _t
        insert_chat_message(
            conversation_id, "ASSISTANT", answer,
            intent=intent, confidence=confidence, latency_ms=0,
            product_ids=product_ids,
        )

        for pid in product_ids:
            log_conversion_event(conversation_id, "RECOMMENDED", user_id=user_id, product_id=pid)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"[persist] chat persistence failed: {e}")


@router.get("/v1/chat/stream")
def chat_stream(
    q: str = Query(..., description="User query"),
    session_id: Optional[str] = Query(None, description="Session ID"),
):
    """SSE streaming chat endpoint."""
    try:
        engine = _get_engine()
        if not engine.is_ready:
            raise HTTPException(status_code=503, detail="Engine warming up...")
        return StreamingResponse(
            engine.chat_stream(q, session_id=session_id),
            media_type="text/event-stream",
        )
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Engine warming up...")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/conversion")
@router.post("/chat/conversion")
def log_conversion(
    conversation_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    event_type: str = Query("ADD_TO_CART"),
    product_id: Optional[str] = Query(None),
    order_id: Optional[str] = Query(None),
):
    """Log a chat conversion event (ADD_TO_CART / ORDER_PLACED) for analytics."""
    try:
        from ai.core.db import log_conversion_event
        ok = log_conversion_event(conversation_id, event_type, user_id=user_id, product_id=product_id, order_id=order_id)
        return {"status": "ok" if ok else "skipped", "event_type": event_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ SEARCH ============


@router.get("/search")
def search(
    q: str = Query(..., description="Search query"),
    top_k: int = Query(10, ge=1, le=50),
):
    """Product search endpoint."""
    try:
        engine = _get_engine()
        if not engine.is_ready:
            raise HTTPException(status_code=503, detail="Engine warming up...")
        return engine.search(q, top_k=top_k)
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Engine warming up...")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ NLU ============


@router.get("/nlu/parse")
@router.post("/nlu/parse")
def parse_nlu(q: str = Query(..., description="Query to analyze")):
    """NLU analysis endpoint."""
    try:
        engine = _get_engine()
        if not engine.is_ready:
            raise HTTPException(status_code=503, detail="Engine warming up...")
        return engine.parse_nlu(q)
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Engine warming up...")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ HEALTH ============


@router.get("/health")
def health():
    """Health check."""
    try:
        from ai.core.db import get_connection
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        engine = _get_engine()
        return {
            "status": "healthy",
            "database": "connected",
            "engine_ready": engine.is_ready if engine else False,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
