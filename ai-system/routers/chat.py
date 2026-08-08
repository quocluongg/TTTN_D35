"""Chat router - RAG pipeline with PhoBERT NLU."""
import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException
from routers.schemas import ChatRequest, ChatResponse
from core import retriever, llm_client
from core.nlu import process_query, NLUResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    """Process chat query through RAG pipeline with NLU."""
    query = payload.query.strip()
    if not query:
        raise HTTPException(400, "Query cannot be empty")

    # 1. NLU Processing (PhoBERT Intent + NER)
    nlu_result = process_query(query)

    # 2. Check out-of-scope
    if nlu_result.is_out_of_scope:
        return ChatResponse(
            query=query,
            response="Xin lỗi, tôi chỉ hỗ trợ tư vấn sản phẩm điện tử. Bạn có thể hỏi về laptop, điện thoại, phụ kiện...",
            intent=nlu_result.intent,
            confidence=nlu_result.confidence,
            sources=[],
            entities=[{"text": e.text, "type": e.entity_type} for e in nlu_result.entities],
            intent_display=nlu_result.intent_display,
        )

    # 3. Build search filters from NER entities
    filters = _build_filters_from_entities(nlu_result)

    # 4. Retrieve relevant chunks
    search_results = retriever.search(query, top_k=5, filters=filters)

    # 5. Build context from results
    context = _build_context(search_results)

    # 6. Generate response
    prompt = _build_prompt(query, context, nlu_result)
    response = await llm_client.generate_response(prompt)

    return ChatResponse(
        query=query,
        response=response,
        intent=nlu_result.intent,
        confidence=nlu_result.confidence,
        sources=[{"id": r["id"], "text": r["text"][:100], "score": round(r["score"], 2)} for r in search_results[:3]],
        entities=[{"text": e.text, "type": e.entity_type} for e in nlu_result.entities],
        intent_display=nlu_result.intent_display,
    )


def _build_filters_from_entities(nlu_result: NLUResult) -> dict | None:
    """Build search filters from NER entities."""
    filters = {}

    for entity in nlu_result.entities:
        if entity.entity_type == "BRAND":
            filters["brand"] = entity.text

    return filters if filters else None


def _build_context(results: list[dict]) -> str:
    """Build context string from search results."""
    if not results:
        return "Không tìm thấy thông tin sản phẩm."

    parts = []
    for i, r in enumerate(results[:5], 1):
        parts.append(f"[{i}] {r['text']}")

    return "\n\n".join(parts)


def _build_prompt(query: str, context: str, nlu_result: NLUResult) -> str:
    """Build prompt for LLM based on intent."""
    intent = nlu_result.intent

    # Intent-specific instructions
    intent_instructions = {
        "ask_specs": "Trả lời chi tiết về thông số kỹ thuật. Liệt kê RAM, CPU, GPU, Storage.",
        "ask_price": "Trả lời rõ ràng về giá sản phẩm. Format: XX.XXX.XXX₫",
        "compare_products": "So sánh các sản phẩm theo từng thông số. Đưa bảng so sánh.",
        "ask_warranty": "Trả lời về chính sách bảo hành, đổi trả.",
        "purchase_consultation": "Đưa ra gợi ý sản phẩm phù hợp với nhu cầu. Giải thích lý do.",
        "ask_promotion": "Thông tin về khuyến mãi, giảm giá hiện có.",
        "order_product": "Hướng dẫn cách đặt hàng, thanh toán.",
        "complain": "Hỗ trợ giải quyết khiếu nại, hướng dẫn đổi trả.",
    }

    specific_instruction = intent_instructions.get(intent, "Trả lời câu hỏi một cách tự nhiên.")

    return f"""Bạn là trợ lý AI tư vấn sản phẩm điện tử của ShopWise.

Quy tắc:
- Chỉ trả lời dựa trên thông tin trong CONTEXT
- Nếu không có thông tin, nói "Tôi không có thông tin về..."
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu
- Format giá: XX.XXX.XXX₫

HƯỚNG DẪN: {specific_instruction}

CONTEXT:
{context}

CÂU HỎI: {query}

TRẢ LỜI:"""
