"""FastAPI routes: chat, search, NLU, health, streaming."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api")


def _get_engine():
    """Get engine from app state."""
    from ai.main import app
    return app.state.engine


# ============ CHAT ============


@router.post("/v1/chat")
@router.get("/v1/chat")
def chat(
    q: str = Query(..., description="User query"),
    session_id: Optional[str] = Query(None, description="Session ID for conversation memory"),
    top_k: int = Query(5, ge=1, le=20),
):
    """Full RAG chat endpoint."""
    try:
        engine = _get_engine()
        if not engine.is_ready:
            raise HTTPException(status_code=503, detail="Engine warming up...")
        return engine.chat(q, session_id=session_id)
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Engine warming up...")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
