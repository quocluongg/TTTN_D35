import sys
import os
import time

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Query, Body
from dotenv import load_dotenv

# Đảm bảo Python import được module trong ai-engine
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.db import get_db_connection, fetch_all_products
from core.retriever import Stage01Retriever
from core.pineline import RAGChatbotPipeline
from nlu.phobert_nlu import PhoBERTElectronicsNLU
from fastapi.middleware.cors import CORSMiddleware
from nlu.schema import NLUResult

load_dotenv()

app = FastAPI(
    title="SHOPWISE AI Recommender & RAG Engine",
    description="Microservice AI & Recommender Engine (PhoBERT NLU + 4-Stage Search + RAG Chatbot + Product Recommender)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo Cache toàn cục
retriever_instance: Optional[Stage01Retriever] = None
nlu_engine_instance: Optional[PhoBERTElectronicsNLU] = None
rag_pipeline_instance: Optional[RAGChatbotPipeline] = None

def get_nlu_engine():
    global nlu_engine_instance
    if nlu_engine_instance is None:
        nlu_engine_instance = PhoBERTElectronicsNLU()
    return nlu_engine_instance

def get_retriever():
    global retriever_instance
    if retriever_instance is None:
        print("🔄 Đang nạp sản phẩm từ Supabase và khởi tạo BM25 + FAISS Index + Cross-Encoder Reranker + Stage 3 MMR...")
        products = fetch_all_products()
        retriever_instance = Stage01Retriever(products, enable_stage2=True, enable_stage3=True)
        print(f"✅ Đã khởi tạo xong Retriever với Stage 0, 1, 2 & Stage 3 cho {len(products)} sản phẩm.")
    return retriever_instance

def get_rag_pipeline():
    global rag_pipeline_instance
    if rag_pipeline_instance is None:
        retriever = get_retriever()
        print("🔄 Đang khởi tạo RAG Chatbot Pipeline 8 bước...")
        rag_pipeline_instance = RAGChatbotPipeline(products=retriever.products)
        rag_pipeline_instance.retriever = retriever
        print("✅ RAG Chatbot Pipeline đã sẵn sàng phục vụ!")
    return rag_pipeline_instance

import threading

@app.on_event("startup")
def startup_event():
    """Khởi động server siêu nhanh (ngay lập tức), nạp trước AI Models ở luồng nền (background thread)"""
    def _warmup():
        try:
            print("🔄 [Background Warmup] Đang nạp trước Retriever và RAG Pipeline...")
            get_retriever()
            get_rag_pipeline()
            print("✅ [Background Warmup] Tất cả AI Models và Indices đã sẵn sàng!")
        except Exception as e:
            print(f"⚠️ [Background Warmup Warning] Lỗi nạp trước: {e}")

    threading.Thread(target=_warmup, daemon=True).start()

@app.get("/")
def root():
    return {
        "service": "SHOPWISE AI Recommender & RAG Engine",
        "status": "running",
        "features": [
            "PhoBERT Vietnamese NLU",
            "4-Stage Hybrid Search (BM25 + FAISS Vector + PhoBERT Reranker + MMR Diversity)",
            "Product Recommender (Multi-Signal Scoring)",
            "End-to-End RAG Chatbot with Response Guardrails"
        ],
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Kiểm tra kết nối Supabase Postgres"""
    start_time = time.time()
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT count(*) FROM products;")
        cnt = cur.fetchone()[0]
        cur.close()
        conn.close()
        
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "healthy",
            "database": "Supabase PostgreSQL",
            "total_products": cnt,
            "latency_ms": latency_ms
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/chat")
@app.get("/api/v1/chat")
def rag_chat_endpoint(
    q: str = Query(..., description="Câu hỏi hoặc yêu cầu tư vấn của khách hàng"),
    top_k: int = Query(5, ge=1, le=20, description="Số lượng sản phẩm ngữ cảnh")
):
    """
    Endpoint RAG Chatbot Tư vấn Mua hàng E-Commerce 8 Bước:
    - NLU Parsing -> Hybrid Retrieval -> Rerank & MMR -> Recommender -> LLM Generation -> Guardrails Validator -> JSON Response
    """
    try:
        pipeline = get_rag_pipeline()
        result = pipeline.process_query(query=q, top_k=top_k)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý RAG Chatbot: {str(e)}")

@app.get("/api/search")
def search_products(
    q: str = Query(..., description="Từ khóa hoặc nhu cầu tìm kiếm"),
    category: Optional[str] = Query(None, description="Lọc danh mục (Điện thoại, Laptop...)"),
    use_case: Optional[str] = Query(None, description="Lọc nhu cầu (Làm việc, Gaming...)"),
    max_price: Optional[float] = Query(None, description="Giá tối đa (VNĐ)"),
    use_stage2: bool = Query(True, description="Kích hoạt Stage 2 Cross-Encoder Reranking"),
    use_stage3: bool = Query(True, description="Kích hoạt Stage 3 MMR Diversity Re-ordering"),
    mmr_lambda: float = Query(0.7, ge=0.0, le=1.0, description="Hệ số cân bằng MMR"),
    top_k: int = Query(10, ge=1, le=50, description="Số lượng sản phẩm trả về")
):
    """
    Endpoint Tìm kiếm & Gợi ý Sản phẩm 4-Stage
    """
    try:
        retriever = get_retriever()
        results = retriever.retrieve_and_rank(
            query=q,
            category=category,
            use_case=use_case,
            max_price=max_price,
            top_k=top_k,
            use_stage2=use_stage2,
            use_stage3=use_stage3,
            mmr_lambda=mmr_lambda
        )
        return {
            "query": q,
            "filters": {
                "category": category,
                "use_case": use_case,
                "max_price": max_price,
            },
            "total_results": len(results),
            "products": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tìm kiếm 4-Stage: {str(e)}")

@app.get("/api/nlu/parse", response_model=NLUResult)
@app.post("/api/nlu/parse", response_model=NLUResult)
def parse_nlu_query(q: str = Query(..., description="Truy vấn Tiếng Việt cần phân tích Intent và NER")):
    """
    Endpoint Phân tích NLU Tiếng Việt Chuyên ngành Điện tử (PhoBERT Joint Intent & NER Engine)
    """
    try:
        engine = get_nlu_engine()
        result = engine.parse(q)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý NLU: {str(e)}")
