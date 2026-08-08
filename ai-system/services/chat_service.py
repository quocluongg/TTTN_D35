"""
Chat Service: Orchestrates the full RAG chat pipeline.
NLU -> Retrieval -> Rerank -> Generation -> Validation
"""
import asyncio
import logging

from api.schemas import ChatResponse, NLUInfo, SourceDocument
from nlu import query_processor as _default_nlu
from retrieval import query_builder as _default_qb
from retrieval import hybrid_retriever as _default_retriever
from retrieval import reranker as _default_reranker
from generation import prompt_builder as _default_prompt_builder
from generation import llm_client as _default_llm_client
from generation import response_validator as _default_validator

logger = logging.getLogger(__name__)


class ChatService:
    """
    Orchestrates the full RAG chat pipeline:
    NLU -> Retrieval -> Rerank -> Generation -> Validation

    All pipeline components are injectable for testing.
    Defaults to the real module implementations when not provided.
    """

    def __init__(
        self,
        nlu_processor=None,
        query_builder=None,
        retriever=None,
        reranker=None,
        prompt_builder=None,
        llm_client=None,
        validator=None,
    ):
        self.nlu_processor = nlu_processor or _default_nlu
        self.query_builder = query_builder or _default_qb
        self.retriever = retriever or _default_retriever
        self.reranker = reranker or _default_reranker
        self.prompt_builder = prompt_builder or _default_prompt_builder
        # llm_client is the actual client instance with generate_response()
        self.llm_client = llm_client or _default_llm_client.get_llm_client()
        self.validator = validator or _default_validator

    async def process_chat(self, query: str) -> ChatResponse:
        """
        Process a chat query through the full RAG pipeline.

        Args:
            query: User's question in Vietnamese

        Returns:
            ChatResponse with answer, sources, and metadata
        """
        # Step 1: NLU Processing (Intent & NER on thread pool to avoid blocking)
        nlu_result = await asyncio.to_thread(
            self.nlu_processor.process_query, query
        )

        nlu_info = NLUInfo(
            intent=nlu_result.intent,
            confidence=nlu_result.confidence,
            entities=[{"text": e.text, "type": e.entity_type} for e in nlu_result.entities],
            is_out_of_scope=nlu_result.is_out_of_scope,
        )

        # Step 2: Check out-of-scope -> Fast reply if question is outside scope
        if nlu_result.is_out_of_scope:
            return ChatResponse(
                query=query,
                response=(
                    "Xin lỗi quý khách, em là AI hỗ trợ tư vấn thiết bị "
                    "công nghệ (Laptop, Điện thoại, Phụ kiện) của ShopWise. "
                    "Câu hỏi này nằm ngoài phạm vi tư vấn của em ạ!"
                ),
                nlu_info=nlu_info,
                sources=[],
                validation_status={"is_valid": True, "reason": "out_of_scope_fast_reply"},
            )

        # Step 3: Build retrieval query from NLU result
        retrieval_query = self.query_builder.build_retrieval_query(nlu_result)

        # Step 4: Hybrid Retrieval (Dense ChromaDB + Sparse BM25 + RRF Fusion)
        raw_docs = await asyncio.to_thread(
            self.retriever.retrieve, retrieval_query
        )

        # Step 5: Cross-Encoder Re-ranking
        reranked_docs = await asyncio.to_thread(
            self.reranker.rerank_documents, query, raw_docs
        )

        # Step 6: Build System & User Prompt with context for LLM
        prompt = self.prompt_builder.build_prompt(query, reranked_docs, nlu_result)

        # Step 7: Generate response from LLM
        raw_response = await self.llm_client.generate_response(prompt)

        # Step 8: Validate response (Faithfulness & Numerical Consistency)
        validation = self.validator.validate_response(
            raw_response, reranked_docs, query
        )

        # Step 9: Build source documents list
        source_docs = [
            SourceDocument(
                id=d.id,
                text=d.text,
                metadata=d.metadata,
                score=d.score,
            )
            for d in reranked_docs
        ]

        # Step 10: Return complete response
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


# Singleton instance
_chat_service = None


def get_chat_service() -> ChatService:
    """Get or create the singleton ChatService instance."""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
