"""
Tệp Pipeline chính tích hợp toàn bộ Kiến trúc RAG Chatbot 8 Bước:
Data Ingestion -> Vector/BM25 Index -> Query NLU (Intent/NER) -> Hybrid Retrieval -> Re-ranking & MMR -> LLM Generation -> Response Validation -> JSON Response
"""

import os
import sys
import logging
from typing import List, Dict, Any, Optional

# Nạp các core modules
from core.db import fetch_all_products
from core.retriever import Stage01Retriever
from core.recommender import ProductRecommender
from nlu.phobert_nlu import PhoBERTElectronicsNLU
from chatbot.llm_client import LLMClient
from chatbot.response_validator import ResponseValidator

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
        
        logging.info("[RAG Pipeline] Khởi tạo RAG Pipeline thành công 100%!")

    def process_query(
        self, 
        query: str, 
        user_profile: Optional[Dict[str, Any]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Xử lý câu hỏi người dùng qua 8 bước và trả về kết quả cấu trúc JSON.
        """
        if not query or not query.strip():
            return {"error": "Câu hỏi không được để trống."}

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
                # Thử parse khoảng giá từ text
                digits = "".join([c for c in e.text if c.isdigit()])
                if digits:
                    val = float(digits)
                    if val < 1000: val *= 1_000_000 # convert tr -> VNĐ
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

        # Gợi ý sản phẩm đi kèm qua ProductRecommender (Item-to-Item hoặc User Profile)
        recommended_products = []
        if retrieved_products:
            top_id = str(retrieved_products[0].get("id"))
            recommended_products = self.recommender.recommend_similar_products(product_id=top_id, top_k=4)
        elif user_profile:
            recommended_products = self.recommender.recommend_for_user(user_profile=user_profile, top_k=4)
        else:
            recommended_products = self.recommender.recommend_trending(top_k=4)

        # --- BƯỚC 6: LLM GENERATION ---
        raw_llm_response = self.llm_client.generate_rag_response(
            query=query,
            intent=intent_str,
            entities=entities_list,
            retrieved_context=retrieved_products
        )

        # --- BƯỚC 7: RESPONSE VALIDATION (GUARDRAILS) ---
        validated_text, is_valid, validation_warnings = self.validator.validate_and_correct(
            response_text=raw_llm_response,
            retrieved_context=retrieved_products
        )

        # --- BƯỚC 8: STRUCTURAL RESPONSE ---
        return {
            "query": query,
            "answer": validated_text,
            "intent": intent_str,
            "confidence": nlu_res.confidence,
            "entities": entities_list,
            "retrieved_products": retrieved_products,
            "recommended_products": recommended_products,
            "validation": {
                "is_valid": is_valid,
                "warnings": validation_warnings
            }
        }
