"""Chat router - RAG pipeline with PhoBERT NLU."""
import sys
import os
import time
import logging
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException, Query
from routers.schemas import ChatRequest, ChatResponse
from core import retriever, llm_client
from core.nlu import process_query, NLUResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat_endpoint(
    payload: ChatRequest,
    conversation_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
):
    """Process chat query through RAG pipeline with NLU."""
    start_time = time.time()
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

    # Build response
    sources = [{"id": r["id"], "text": r["text"][:100], "score": round(r["score"], 2)} for r in search_results[:3]]
    entities = [{"text": e.text, "type": e.entity_type} for e in nlu_result.entities]

    # Log interaction
    latency_ms = int((time.time() - start_time) * 1000)
    try:
        from routers.rag_admin import log_chat
        log_chat(query, nlu_result.intent, nlu_result.confidence, response, sources, latency_ms)
    except:
        pass

    # Save messages to database if conversation_id provided
    if conversation_id:
        try:
            _save_message(conversation_id, "user", query, {})
            _save_message(conversation_id, "assistant", response, {
                "intent": nlu_result.intent,
                "confidence": nlu_result.confidence,
                "sources": sources,
                "entities": entities,
            })
        except Exception as e:
            logger.warning(f"Failed to save messages: {e}")

    return ChatResponse(
        query=query,
        response=response,
        intent=nlu_result.intent,
        confidence=nlu_result.confidence,
        sources=sources,
        entities=entities,
        intent_display=nlu_result.intent_display,
    )


def _save_message(conversation_id: str, role: str, content: str, metadata: dict):
    """Save message to database."""
    import json
    from db.supabase_client import get_connection

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO rag_messages (conversation_id, role, content, confidence, sources, suggested_products, provider)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            conversation_id,
            role,
            content,
            metadata.get("confidence"),
            json.dumps(metadata.get("sources", [])),
            json.dumps(metadata.get("suggested_products", [])),
            "gemini",
        ))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


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
        "ask_specs": "Nêu 3-4 thông số kỹ thuật nổi bật nhất dạng gạch đầu dòng ngắn gọn.",
        "ask_price": "Báo giá sản phẩm trực tiếp, ngắn gọn. Format giá: XX.XXX.XXX₫.",
        "compare_products": "So sánh vắn tắt 2-3 điểm khác biệt chính (Giá, Cấu hình, Nhu cầu).",
        "ask_warranty": "Trả lời ngắn gọn về thời gian và chính sách bảo hành.",
        "purchase_consultation": "Gợi ý 1-2 sản phẩm phù hợp nhất với giá và ưu điểm chính.",
        "ask_promotion": "Thông tin khuyến mãi hiện có ngắn gọn.",
        "order_product": "Xác nhận và hướng dẫn thao tác đặt hàng nhanh.",
        "complain": "Thể hiện sự đồng cảm, xin lỗi và hướng dẫn kênh hỗ trợ.",
    }

    specific_instruction = intent_instructions.get(intent, "Trả lời câu hỏi ngắn gọn, tự nhiên.")

    return f"""Bạn là Nhân viên Tư vấn Bán hàng chuyên nghiệp của ShopWise.

Quy tắc bắt buộc:
- Xưng "em" và gọi khách hàng là "anh/chị"
- Trả lời NGẮN GỌN (tối đa 2-4 câu hoặc vài gạch đầu dòng ngắn), đi thẳng vào vấn đề
- CHỈ dựa vào thông tin trong CONTEXT, không bịa đặt
- Luôn kết thúc bằng 1 câu hỏi mở gợi ý hỗ trợ/đặt hàng

HƯỚNG DẪN: {specific_instruction}

CONTEXT:
{context}

CÂU HỎI: {query}

TRẢ LỜI:"""
