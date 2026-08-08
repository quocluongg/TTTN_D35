"""
FastAPI Router cho Endpoint Chat RAG.
Nối toàn bộ pipeline từ NLU -> Retrieval -> Rerank -> Generation -> Validation.
"""
import logging
import asyncio

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException

from api.schemas import ChatRequest, ChatResponse, SourceDocument, NLUInfo
from nlu import query_processor
from retrieval import query_builder, hybrid_retriever, reranker
from generation import prompt_builder, llm_client, response_validator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat-rag"])


@router.post("", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    """
    Endpoint chính xử lý trò chuyện và tư vấn sản phẩm RAG Chatbot.
    """
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Câu hỏi truy vấn không được để rỗng.")

    # 1. NLU Processing (Chạy trên worker thread để tránh block event loop)
    nlu_result = await asyncio.to_thread(query_processor.process_query, query)


    nlu_info = NLUInfo(
        intent=nlu_result.intent,
        confidence=nlu_result.confidence,
        entities=[{"text": e.text, "type": e.entity_type} for e in nlu_result.entities],
        is_out_of_scope=nlu_result.is_out_of_scope,
    )

    # 2. Kiểm tra Out-of-Scope -> Phản hồi từ chối ngay lập tức nếu câu hỏi ngoài phạm vi
    if nlu_result.is_out_of_scope:
        return ChatResponse(
            query=query,
            response="Xin lỗi quý khách, em là AI hỗ trợ tư vấn thiết bị công nghệ (Laptop, Điện thoại, Phụ kiện) của ShopWise. Câu hỏi này nằm ngoài phạm vi tư vấn của em ạ!",
            nlu_info=nlu_info,
            sources=[],
            validation_status={"is_valid": True, "reason": "out_of_scope_fast_reply"},
        )

    # 3. Query Construction
    retrieval_query = query_builder.build_retrieval_query(nlu_result)

    # 4. Hybrid Retrieval (Dense + BM25 + RRF)
    raw_docs = await asyncio.to_thread(hybrid_retriever.retrieve, retrieval_query)

    # 5. Cross-Encoder Re-ranking
    reranked_docs = await asyncio.to_thread(reranker.rerank_documents, query, raw_docs)

    # 6. Prompt Construction
    prompt = prompt_builder.build_prompt(query, reranked_docs, nlu_result)

    # 7. LLM Generation
    client = llm_client.get_llm_client()
    raw_response = await client.generate_response(prompt)

    # 8. Response Validation (Chống hallucination)
    validation = response_validator.validate_response(raw_response, reranked_docs, query)

    # Convert retrieved docs sang Pydantic schema
    source_docs = [
        SourceDocument(
            id=d.id,
            text=d.text,
            metadata=d.metadata,
            score=d.score,
        )
        for d in reranked_docs
    ]

    return ChatResponse(
        query=query,
        response=validation.sanitized_response,
        nlu_info=nlu_info,
        sources=source_docs,
        validation_status={
            "is_valid": validation.is_valid,
            "faithfulness_score": round(validation.faithfulness_score, 2),
            "numerical_consistency": validation.numerical_consistency,
            "issues": validation.issues,
        },
    )
