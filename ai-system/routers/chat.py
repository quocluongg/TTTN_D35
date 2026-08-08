"""Chat router - RAG pipeline."""
import sys
import os
import logging

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException
from routers.schemas import ChatRequest, ChatResponse
from core import retriever, llm_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    """Process chat query through RAG pipeline."""
    query = payload.query.strip()
    if not query:
        raise HTTPException(400, "Query cannot be empty")

    # 1. Simple intent detection
    intent, confidence = _detect_intent(query)

    # 2. Build search filters from query
    filters = _extract_filters(query)

    # 3. Retrieve relevant chunks
    search_results = retriever.search(query, top_k=5, filters=filters)

    # 4. Build context from results
    context = _build_context(search_results)

    # 5. Generate response
    prompt = _build_prompt(query, context, intent)
    response = await llm_client.generate_response(prompt)

    return ChatResponse(
        query=query,
        response=response,
        intent=intent,
        confidence=confidence,
        sources=[{"id": r["id"], "text": r["text"][:100], "score": round(r["score"], 2)} for r in search_results[:3]],
    )


def _detect_intent(query: str) -> tuple[str, float]:
    """Simple keyword-based intent detection."""
    q = query.lower()

    if any(w in q for w in ["giá", "bao nhiêu", "tiền", "cost", "price"]):
        return "price_query", 0.85
    if any(w in q for w in ["so sánh", "khác gì", "vs", "compare"]):
        return "comparison_query", 0.85
    if any(w in q for w in ["ram", "cpu", "ssd", "gpu", "thông số", "specs"]):
        return "spec_query", 0.85
    if any(w in q for w in ["bảo hành", "warranty"]):
        return "warranty_query", 0.85
    if any(w in q for w in ["tư vấn", "nên mua", "recommend", "gợi ý"]):
        return "purchase_advice", 0.80
    if any(w in q for w in ["khuyến mãi", "giảm giá", "sale", "discount"]):
        return "promotion_query", 0.80

    return "general_query", 0.60


def _extract_filters(query: str) -> dict | None:
    """Extract brand/category filters from query."""
    q = query.upper()
    brands = ["ASUS", "ACER", "DELL", "HP", "LENOVO", "MSI", "APPLE", "SAMSUNG"]

    for brand in brands:
        if brand in q:
            return {"brand": brand}

    return None


def _build_context(results: list[dict]) -> str:
    """Build context string from search results."""
    if not results:
        return "Không tìm thấy thông tin sản phẩm."

    parts = []
    for i, r in enumerate(results[:5], 1):
        parts.append(f"[{i}] {r['text']}")

    return "\n\n".join(parts)


def _build_prompt(query: str, context: str, intent: str) -> str:
    """Build prompt for LLM."""
    return f"""Bạn là trợ lý AI tư vấn sản phẩm điện tử của ShopWise.

Quy tắc:
- Chỉ trả lời dựa trên thông tin trong CONTEXT
- Nếu không có thông tin, nói "Tôi không có thông tin về..."
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu
- Format giá: XX.XXX.XXX₫

CONTEXT:
{context}

CÂU HỎI: {query}

TRẢ LỜI:"""
