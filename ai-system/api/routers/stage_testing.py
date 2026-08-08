"""
FastAPI Router kiểm thử từng Stage trong Pipeline RAG Chatbot:
Stage 1: NLU (Out-of-Scope, Intent, NER)
Stage 2: Hybrid Retrieval (ChromaDB + BM25 + RRF Fusion)
Stage 3: Cross-Encoder Reranking & LLM Generation + Response Validation
"""
import asyncio
import logging
from fastapi import APIRouter, HTTPException

from api.schemas import (
    ChatRequest,
    Stage1NLUResponse,
    Stage2RetrievalResponse,
    Stage3GenerationResponse,
    SourceDocument,
)
from nlu import query_processor
from retrieval import query_builder, hybrid_retriever, reranker
from generation import prompt_builder, llm_client, response_validator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test", tags=["rag-stage-testing"])


@router.post("/stage1-nlu", response_model=Stage1NLUResponse)
async def test_stage1_nlu(payload: ChatRequest):
    """
    IPO Model:
    - Input: payload (ChatRequest chứa câu hỏi 'query')
    - Process:
        Step 1: Chuẩn hóa câu hỏi đầu vào
        Step 2: Thực thi nlu.query_processor.process_query (Phân loại Intent & Trích xuất Thực thể NER)
        Step 3: Đóng gói kết quả phân tích NLU vào Stage1NLUResponse
    - Output: Stage1NLUResponse (câu truy vấn, intent, confidence, entities, is_out_of_scope)
    """
    # Step 1: Kiểm tra và chuẩn hóa chuỗi đầu vào
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query không được để trống.")

    # Step 2: Xử lý NLU bằng module query_processor trong thread riêng
    nlu_result = await asyncio.to_thread(query_processor.process_query, query)

    # Step 3: Định dạng kết quả trả về cho client
    return Stage1NLUResponse(
        query=query,
        intent=nlu_result.intent,
        confidence=round(nlu_result.confidence, 4),
        entities=[{"text": e.text, "type": e.entity_type} for e in nlu_result.entities],
        intent_scores={k: round(v, 4) for k, v in nlu_result.intent_scores.items()},
        is_out_of_scope=nlu_result.is_out_of_scope,
    )


@router.post("/stage2-retrieval", response_model=Stage2RetrievalResponse)
async def test_stage2_retrieval(payload: ChatRequest):
    """
    IPO Model:
    - Input: payload (ChatRequest chứa câu hỏi 'query')
    - Process:
        Step 1: Chuẩn hóa câu hỏi đầu vào
        Step 2: Xử lý NLU để xác định Intent và Thực thể
        Step 3: Xây dựng RetrievalQuery (từ khóa search + bộ lọc metadata)
        Step 4: Thực thi Hybrid Retrieval (Dense Search ChromaDB + Sparse Search BM25 + RRF Fusion)
        Step 5: Đóng gói kết quả tài liệu tìm kiếm được
    - Output: Stage2RetrievalResponse (danh sách tài liệu kèm điểm RRF score)
    """
    # Step 1: Chuẩn hóa dữ liệu đầu vào
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query không được để trống.")

    # Step 2: Xử lý NLU và xây dựng Retrieval Query
    nlu_result = await asyncio.to_thread(query_processor.process_query, query)
    retrieval_query = query_builder.build_retrieval_query(nlu_result)

    # Step 3: Thực hiện tìm kiếm hỗn hợp Hybrid Retrieval
    raw_docs = await asyncio.to_thread(hybrid_retriever.retrieve, retrieval_query)

    # Step 4: Chuyển đổi các tài liệu sang schema SourceDocument
    documents = [
        SourceDocument(
            id=d.id,
            text=d.text,
            metadata=d.metadata,
            score=round(d.score, 4),
        )
        for d in raw_docs
    ]

    # Step 5: Trả về phản hồi chi tiết Stage 2
    return Stage2RetrievalResponse(
        query=query,
        search_text=retrieval_query.search_text,
        filters=retrieval_query.filters,
        preferred_chunk_types=retrieval_query.preferred_chunk_types,
        total_docs=len(documents),
        documents=documents,
    )


@router.post("/stage3-generation", response_model=Stage3GenerationResponse)
async def test_stage3_generation(payload: ChatRequest):
    """
    IPO Model:
    - Input: payload (ChatRequest chứa câu hỏi 'query')
    - Process:
        Step 1: Chuẩn hóa câu hỏi đầu vào
        Step 2: Thực thi Stage 1 NLU & Stage 2 Retrieval để lấy ngữ cảnh
        Step 3: Đánh giá lại thứ tự tài liệu bằng Cross-Encoder Re-ranker
        Step 4: Xây dựng Prompt cho LLM
        Step 5: Sinh phản hồi từ LLM Client
        Step 6: Kiểm định tính trung thực và nhất quán của câu trả lời (Response Validation)
    - Output: Stage3GenerationResponse (câu trả lời gốc, câu trả lời đã lọc, kết quả kiểm định)
    """
    # Step 1: Chuẩn hóa câu truy vấn đầu vào
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query không được để trống.")

    # Step 2: Chạy NLU và Retrieval lấy dữ liệu nền
    nlu_result = await asyncio.to_thread(query_processor.process_query, query)
    retrieval_query = query_builder.build_retrieval_query(nlu_result)
    raw_docs = await asyncio.to_thread(hybrid_retriever.retrieve, retrieval_query)

    # Step 3: Re-rank các tài liệu retrieved bằng Cross-Encoder
    reranked_docs = await asyncio.to_thread(reranker.rerank_documents, query, raw_docs)

    # Step 4: Tạo Prompt hoàn chỉnh gửi tới LLM
    prompt = prompt_builder.build_prompt(query, reranked_docs, nlu_result)

    # Step 5: Sinh phản hồi từ mô hình ngôn ngữ LLM
    client = llm_client.get_llm_client()
    raw_response = await client.generate_response(prompt)

    # Step 6: Kiểm định chất lượng câu trả lời (Check Hallucination & Số liệu)
    validation = response_validator.validate_response(raw_response, reranked_docs, query)

    # Step 7: Chuyển đổi dữ liệu tài liệu sang Pydantic schema
    source_docs = [
        SourceDocument(
            id=d.id,
            text=d.text,
            metadata=d.metadata,
            score=round(d.score, 4),
        )
        for d in reranked_docs
    ]

    # Step 8: Trả về chi tiết kết quả Stage 3
    return Stage3GenerationResponse(
        query=query,
        nlu_intent=nlu_result.intent,
        reranked_docs=source_docs,
        prompt_used=prompt,
        raw_response=raw_response,
        sanitized_response=validation.sanitized_response,
        validation_status={
            "is_valid": validation.is_valid,
            "faithfulness_score": round(validation.faithfulness_score, 2),
            "numerical_consistency": validation.numerical_consistency,
            "issues": validation.issues,
        },
    )

