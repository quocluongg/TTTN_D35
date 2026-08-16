"""
Tệp Pipeline chính tích hợp toàn bộ Kiến trúc RAG Chatbot 8 Bước:
Data Ingestion -> Vector/BM25 Index -> Query NLU (Intent/NER) -> Hybrid Retrieval -> Re-ranking & MMR -> LLM Generation -> Response Validation -> JSON Response
Tích hợp Quản lý Cuộc trò chuyện & Chuỗi tin nhắn liên kết (Linked Messages) và Card Product Output.
"""

import os
import sys
import logging
import re
from typing import List, Dict, Any, Optional

# Nạp các core modules
from core.db import fetch_all_products
from core.retriever import Stage01Retriever
from core.recommender import ProductRecommender
from core.conversation_manager import get_conversation_manager
from nlu.phobert_nlu import PhoBERTElectronicsNLU
from chatbot.llm_client import LLMClient
from chatbot.response_validator import ResponseValidator


def _format_product_card(p: Dict[str, Any]) -> Dict[str, Any]:
    """Chuyển đổi dữ liệu sản phẩm truy xuất thành đối tượng Product Card chuẩn."""
    raw_name = p.get("name") or p.get("product_name") or "Sản phẩm"
    raw_slug = p.get("slug")
    if not raw_slug:
        raw_slug = re.sub(r'[^a-z0-9]+', '-', raw_name.lower()).strip('-')

    price = p.get("price") or p.get("price_from") or 0
    try:
        price_val = float(price)
    except (TypeError, ValueError):
        price_val = 0.0

    return {
        "id": str(p.get("id", "")),
        "slug": raw_slug,
        "name": raw_name,
        "brand": p.get("brand", "ShopWise"),
        "thumbnail": p.get("thumbnail") or p.get("image_url") or f"/uploads/products/{raw_slug}.jpg",
        "price_from": price_val,
        "category_name": p.get("category_name") or p.get("category") or "Điện tử",
        "rating_avg": float(p.get("rating_avg") or p.get("rating") or 4.8),
        "review_count": int(p.get("review_count") or p.get("reviews_count") or 0),
        "product_url": p.get("product_url") or f"/product/{raw_slug}"
    }


class RAGChatbotPipeline:
    """
    Hệ thống RAG Chatbot E-Commerce toàn diện (End-to-End Pipeline).
    """
    def __init__(self, products: Optional[List[Dict[str, Any]]] = None):
        logging.info("[RAG Pipeline] Đang khởi tạo hệ thống RAG Chatbot 8 bước...")

        # 1. Product Data Ingestion
        if products:
            self.products = products
        else:
            try:
                self.products = fetch_all_products()
                logging.info(f"[RAG Pipeline] Nạp thành công {len(self.products)} sản phẩm từ Database.")
            except Exception as e:
                logging.warning(f"[RAG Pipeline Warning] Không nạp được DB ({e}), khởi tạo tập rỗng.")
                self.products = []

        # 2. Vector DB + BM25 Index & Retriever (Stage 0, 1, 2, 3)
        self.retriever = Stage01Retriever(self.products, enable_stage2=True, enable_stage3=True)
        self.recommender = ProductRecommender(self.products, use_vector_search=False)

        # 3. Query Processing - PhoBERT NLU
        self.nlu_engine = PhoBERTElectronicsNLU()

        # 6. LLM Generation
        self.llm_client = LLMClient()

        # 7. Response Validation
        self.validator = ResponseValidator()

        # Conversation Manager
        self.conv_manager = get_conversation_manager()

        logging.info("[RAG Pipeline] Khởi tạo RAG Pipeline thành công 100%!")

    def process_query(
        self,
        query: str,
        user_profile: Optional[Dict[str, Any]] = None,
        top_k: int = 5,
        conversation_id: Optional[str] = None,
        parent_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Xử lý câu hỏi người dùng qua 8 bước và liên kết chuỗi tin nhắn trong Conversation.
        """
        if not query or not query.strip():
            return {"error": "Câu hỏi không được để trống."}

        # Quản lý Conversation ID & Linked Message context
        if not conversation_id:
            conversation_id = self.conv_manager.create_conversation(metadata={"source": "api"})

        # Lấy chuỗi lịch sử tin nhắn liên kết trước đó
        conversation_history = self.conv_manager.get_conversation_history(
            conversation_id=conversation_id,
            last_message_id=parent_id,
            max_turns=6
        )

        # 1. Lưu user message vào chuỗi liên kết
        user_msg = self.conv_manager.add_message(
            conversation_id=conversation_id,
            role="user",
            content=query,
            parent_id=parent_id
        )
        user_msg_id = user_msg["id"]

        # --- BƯỚC 3: QUERY PROCESSING (NLU INTENT & NER) ---
        nlu_res = self.nlu_engine.parse(query)
        intent_str = nlu_res.intent.value if hasattr(nlu_res.intent, "value") else str(nlu_res.intent)
        entities_list = [
            {
                "text": e.text,
                "entity_type": e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type),
                "confidence": e.confidence
            }
            for e in nlu_res.entities
        ]

        # Trích xuất Hard Filters từ thực thể NER
        max_price = None
        category_filter = None
        for e in nlu_res.entities:
            e_type = e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)
            if e_type == "PRICE":
                digits = "".join([c for c in e.text if c.isdigit()])
                if digits:
                    val = float(digits)
                    if val < 1000: val *= 1_000_000  # convert tr -> VNĐ
                    max_price = val
            elif e_type == "BRAND":
                pass

        # --- BƯỚC 4 & 5: HYBRID RETRIEVAL, RE-RANKING & MMR ---
        retrieved_products = self.retriever.retrieve_and_rank(
            query=query,
            category=category_filter,
            max_price=max_price,
            top_k=top_k,
            use_stage2=True,
            use_stage3=True
        )

        # Gợi ý sản phẩm đi kèm qua ProductRecommender
        recommended_products = []
        if retrieved_products:
            top_id = str(retrieved_products[0].get("id"))
            recommended_products = self.recommender.recommend_similar_products(product_id=top_id, top_k=4)
        elif user_profile:
            recommended_products = self.recommender.recommend_for_user(user_profile=user_profile, top_k=4)
        else:
            recommended_products = self.recommender.recommend_trending(top_k=4)

        # Tạo danh sách Card Products cho response JSON
        product_cards = [_format_product_card(p) for p in retrieved_products[:3]]

        # --- BƯỚC 6: LLM GENERATION WITH LINKED CONVERSATION HISTORY ---
        raw_llm_response = self.llm_client.generate_rag_response(
            query=query,
            intent=intent_str,
            entities=entities_list,
            retrieved_context=retrieved_products,
            conversation_history=conversation_history
        )

        # --- BƯỚC 7: RESPONSE VALIDATION (GUARDRAILS) ---
        validated_text, is_valid, validation_warnings = self.validator.validate_and_correct(
            response_text=raw_llm_response,
            retrieved_context=retrieved_products
        )

        # 2. Lưu bot message vào chuỗi liên kết (parent_id trỏ về user_msg_id)
        bot_msg = self.conv_manager.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=validated_text,
            parent_id=user_msg_id,
            confidence=nlu_res.confidence,
            sources=product_cards,
            suggested_products=recommended_products,
            provider="gemini"
        )
        bot_msg_id = bot_msg["id"]

        sources_snippets = [
            {"id": p.get("id"), "title": p.get("name"), "price": p.get("price_from")}
            for p in product_cards
        ]

        # --- BƯỚC 8: STRUCTURAL RESPONSE WITH PRODUCT CARDS & LINKED MESSAGE METADATA ---
        return {
            "response": validated_text,
            "answer": validated_text,
            "intent": intent_str,
            "confidence": round(float(nlu_res.confidence), 2) if nlu_res.confidence else 0.95,
            "products": product_cards,
            "sources": sources_snippets,
            "query": query,
            "entities": entities_list,
            "retrieved_products": retrieved_products,
            "recommended_products": recommended_products,
            "conversation_id": conversation_id,
            "message_id": bot_msg_id,
            "user_message_id": user_msg_id,
            "parent_id": user_msg_id,  # Con trỏ liên kết của tin nhắn bot về tin nhắn user
            "history_length": len(conversation_history),
            "validation": {
                "is_valid": is_valid,
                "warnings": validation_warnings
            }
        }
