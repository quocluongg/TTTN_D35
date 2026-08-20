# Công nghệ hệ thống AI (Chatbot RAG ShopWise)

Tổng hợp từ mã nguồn thư mục `ai/` (Python FastAPI).

## 1. Nền tảng & framework
- **Python 3** + **FastAPI** (web framework, SSE streaming) + **Uvicorn** (ASGI server)
- **Pydantic** (validation/model), **python-dotenv** (config `.env`)
- **psycopg2-binary** (kết nối DB)

## 2. Mô hình ngôn ngữ (LLM)
- **Google Gemini** (`google-genai`, model `gemini-2.0-flash`) — sinh câu trả lời RAG
- **Template fallback** (rule-based) khi Gemini lỗi/không có key

## 3. Embedding & Vector Search
- **Sentence-Transformers**
- **BAAI/bge-m3** (embedding đa ngôn ngữ, 1024-dim) — fallback `paraphrase-multilingual-MiniLM-L12-v2`
- **pgvector** (extension PostgreSQL của **Supabase**) — tìm kiếm semantic ANN
- **Supabase PostgreSQL** (hosted, lưu products/chunks/conversations/events)

## 4. NLU (Hiểu ý định tiếng Việt)
- **PhoBERT** (`souta04/phobert-electronics-e-commerce-nlu`) qua **HuggingFace transformers + PyTorch** — phân loại ý định 10 lớp
- **Rule-based engine** (regex) — fallback + luôn làm **NER**
- **pyvi (ViTokenizer)** — tách từ tiếng Việt cho BM25

## 5. Pipeline truy xuất (4 stages hybrid)
- **BM25** (`rank_bm25`, BM25Okapi) — tìm lexical
- **Dense vector search** (pgvector) — tìm semantic
- **Hybrid scoring**: BM25 (0.5) + Vector (0.3) + Budget (0.1) + Rating (0.1)
- **Cross-Encoder reranker** (`cross-encoder/ms-marco-MiniLM-L-6-v2`) — giai đoạn 2
- **MMR** (Maximal Marginal Relevance) — đa dạng hóa kết quả (giai đoạn 3)
- **Off-topic gate** — chặn câu hỏi ngoài phạm vi bằng embedding similarity

## 6. Gợi ý sản phẩm (Recommender)
- **scikit-learn** `TfidfVectorizer` + cosine similarity
- Bonus theo category + **Jaccard** specs + độ gần giá
- **numpy**, **scipy** (tính toán)

## 7. Thành phần khác
- **SessionStore** (in-memory, TTL + max turns) — quản lý ngữ cảnh hội thoại
- **ResponseValidator** — kiểm tra đầu ra
- **torch** / **transformers** / **HuggingFace Hub** — tải PhoBERT & CrossEncoder

## 8. Tích hợp
- **Next.js (React)** frontend gọi AI qua `fetch` tới `NEXT_PUBLIC_AI_API_URL` (SSE)
- Backend thương mại **Spring Boot** riêng biệt quản lý giỏ hàng/đơn hàng

## Tóm tắt
**RAG tiếng Việt** = FastAPI + Gemini + BGE-M3/pgvector + PhoBERT + BM25 hybrid + CrossEncoder + MMR, trên Supabase Postgres.
