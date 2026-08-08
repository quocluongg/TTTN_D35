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
    STAGED TEST 1: Kiểm thử NLU Module (Phân tích cú pháp & ngữ nghĩa).
    - Xử lý Out of Scope
    - Phân loại Intent (PhoBERT)
    - Trích xuất Thực thể (NER)
    """
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query không được để trống.")

    nlu_result = await asyncio.to_thread(query_processor.process_query, query)

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
    STAGED TEST 2: Kiểm thử Retrieval Module (Dense ChromaDB + Sparse BM25 + RRF Fusion).
    - Sinh RetrievalQuery từ kết quả NLU
    - Thực hiện Dense Search và BM25 Search
    - Dung hợp kết quả bằng Reciprocal Rank Fusion (RRF)
    """
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query không được để trống.")

    nlu_result = await asyncio.to_thread(query_processor.process_query, query)
    retrieval_query = query_builder.build_retrieval_query(nlu_result)

    raw_docs = await asyncio.to_thread(hybrid_retriever.retrieve, retrieval_query)

    documents = [
        SourceDocument(
            id=d.id,
            text=d.text,
            metadata=d.metadata,
            score=round(d.score, 4),
        )
        for d in raw_docs
    ]

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
    STAGED TEST 3: Kiểm thử Generation & Validation Module (Rerank -> Prompt -> LLM -> Validation).
    - Cross-Encoder Re-ranking
    - Prompt Construction
    - LLM Generation
    - Response Validation (Faithfulness & Numerical Consistency)
    """
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query không được để trống.")

    # Execute Stage 1 & 2
    nlu_result = await asyncio.to_thread(query_processor.process_query, query)
    retrieval_query = query_builder.build_retrieval_query(nlu_result)
    raw_docs = await asyncio.to_thread(hybrid_retriever.retrieve, retrieval_query)

    # Execute Stage 3
    reranked_docs = await asyncio.to_thread(reranker.rerank_documents, query, raw_docs)
    prompt = prompt_builder.build_prompt(query, reranked_docs, nlu_result)

    client = llm_client.get_llm_client()
    raw_response = await client.generate_response(prompt)
    validation = response_validator.validate_response(raw_response, reranked_docs, query)

    source_docs = [
        SourceDocument(
            id=d.id,
            text=d.text,
            metadata=d.metadata,
            score=round(d.score, 4),
        )
        for d in reranked_docs
    ]

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
