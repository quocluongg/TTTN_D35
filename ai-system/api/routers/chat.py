"""
FastAPI Router cho Endpoint Chat RAG.
Sử dụng ChatService để orchestrate toàn bộ pipeline.
"""
import logging

from fastapi import APIRouter, HTTPException

from api.schemas import ChatRequest, ChatResponse
from services.chat_service import get_chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat-rag"])


@router.post("", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    """
    Process chat query through RAG pipeline.

    Steps:
    1. Validate input
    2. Process through ChatService (NLU -> Retrieval -> Rerank -> Generation -> Validation)
    3. Return response
    """
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Câu hỏi truy vấn không được để rỗng.")

    chat_service = get_chat_service()
    response = await chat_service.process_chat(query)

    return response

