# ENVIRONMENT - SHOPWISE AI v3

Thông tin cấu hình môi trường cho dự án **SHOPWISE AI Recommender & RAG Engine v3**.

---

## 1. Yêu cầu hệ thống

| Thành phần | Phiên bản |
|---|---|
| Python | 3.12+ |
| OS | Windows 10/11 (đã test) |
| RAM khuyến nghị | 8GB+ (do load embedding model) |
| Disk | ~5GB (models + dependencies) |

---

## 2. Cài đặt Dependencies

```bash
cd ai-v3
pip install -r requirements.txt
```
## 3. Biến môi trường (.env)

File `.env` nằm tại `ai-v3/.env`. Dưới đây là toàn bộ biến:

### 3.1 Supabase PostgreSQL (pgvector)

| Biến | Giá trị hiện tại | Mô tả |
|---|---|---|
| `DB_HOST` | `aws-0-ap-southeast-1.pooler.supabase.com` | Supabase Pooler host |
| `DB_PORT` | `6543` | PgBouncer Transaction Pooler port |
| `DB_NAME` | `postgres` | Tên database |
| `DB_USER` | `postgres.zzukpubwbntihzztilqy` | Database user (project-ref format) |
| `DB_PASSWORD` | `agW24oOesftDhJkA` | Database password |

### 3.2 Embedding Model

| Biến | Giá trị | Mô tả |
|---|---|---|
| `EMBEDDING_MODEL` | `BAAI/bge-m3` | Sentence-transformers model cho vector embedding |
| `EMBEDDING_DEVICE` | `cpu` | Device chạy embedding (`cpu` / `cuda`) |
| `EMBEDDING_BATCH_SIZE` | `16` | Batch size khi encode embedding |

### 3.3 Reranker Model

| Biến | Giá trị | Mô tả |
|---|---|---|
| `RERANKER_MODEL` | `BAAI/bge-reranker-v2-m3` | Cross-encoder reranker model |
| `RERANKER_DEVICE` | `cpu` | Device chạy reranker |

### 3.4 Retrieval (Tìm kiếm)

| Biến | Giá trị | Mô tả |
|---|---|---|
| `FAISS_INDEX_PATH` | `./faiss_store/index.faiss` | Đường dẫn FAISS vector index |
| `BM25_INDEX_PATH` | `./faiss_store/bm25.pkl` | Đường dẫn BM25 index (pickle) |
| `TOP_K` | `20` | Số lượng kết quả Stage 1 (BM25 + pgvector) |
| `RERANK_TOP_K` | `5` | Số lượng kết quả sau rerank (Stage 3) |
| `MMR_LAMBDA` | `0.7` | Tham số Maximal Marginal Relevance (0=diverse, 1=relevant) |

### 3.5 LLM (Large Language Model)

| Biến | Giá trị | Mô tả |
|---|---|---|
| `GEMINI_API_KEY` | `<your-gcp-api-key>` | API key cho Google GenAI (Gemma/Gemini) |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Tên model LLM chính |
| `GEMINI_MODEL_NAME` | `gemini-3.1-flash-lite` | Tên model cho LLM client |
| `LLM_TEMPERATURE` | `0.2` | Nhiệt độ sinh text (0.0 = deterministic) |

### 3.6 Mimo API (RAGAS Benchmark)

| Biến | Giá trị | Mô tả |
|---|---|---|
| `MIMO_API_KEY` | `tp-smvx...` | API key cho Mimo LLM (dùng trong eval/benchmark) |

### 3.7 Security

| Biến | Giá trị | Mô tả |
|---|---|---|
| `RAG_SYNC_API_KEY` | `your-secret-key-here` | API key bảo vệ sync endpoint |

### 3.8 App Settings

| Biến | Giá trị | Mô tả |
|---|---|---|
| `APP_HOST` | `0.0.0.0` | Host bind |
| `APP_PORT` | `8001` | Port chạy FastAPI server |
| `APP_ENV` | `development` | Môi trường (`development` / `production`) |
| `LOG_LEVEL` | `INFO` | Mức log (`DEBUG` / `INFO` / `WARNING` / `ERROR`) |

---

## 4. Models & AI Components

### 4.1 PhoBERT NLU (Intent + NER)

- **Base model**: `vinai/phobert-base`
- **NER labels** (BIO format, 13 nhãn):
  - `O`, `B-BRAND`, `I-BRAND`, `B-PRODUCT_LINE`, `I-PRODUCT_LINE`
  - `B-CATEGORY`, `I-CATEGORY`, `B-SPEC`, `I-SPEC`
  - `B-PRICE`, `I-PRICE`, `B-VERSION`, `I-VERSION`
- **Fine-tuned NER model**: `D:\ModelAI\ner_finetuned_model\model_finetuned`
- **Training params**: 8 epochs, batch 16, lr 2e-5

### 4.2 Embedding Model

- **Model**: `BAAI/bge-m3` (sentence-transformers)
- **Dimension**: 1024
- **Use case**: Semantic vector search qua pgvector

### 4.3 Reranker

- **Model**: `BAAI/bge-reranker-v2-m3`
- **Type**: Cross-encoder
- **Use case**: Rerank kết quả retrieval (Stage 3)

### 4.4 LLM

- **Primary**: Google GenAI API (`gemma-4-31B-it`)
- **Fallback**: Template-based grounded response generator (không cần API key)
- **Client library**: `google-genai` (NOT `google-generativeai`)

---

## 5. Database Schema (Supabase PostgreSQL + pgvector)

### Bảng chính

- **`products`** — Catalog sản phẩm điện tử
  - `id`, `name`, `brand`, `price`, `category`, `specs`, `description`, `rating`, `image_url`, ...
- **`product_chunks`** — Text chunks cho RAG retrieval
  - `id`, `product_id`, `chunk_text`, `embedding` (vector(1024)), ...
- **`chat_logs`** — Lịch sử chat
  - `id`, `query`, `intent`, `confidence`, `response`, `latency_ms`, `created_at`

### Extensions

- `vector` (pgvector) — Hỗ trợ cosine similarity search trên embedding

---

## 6. Kiến trúc Pipeline (4-Stage Search)

```
Query → [NLU PhoBERT] → Intent + Entities
         ↓
Stage 1: BM25 + pgvector (TOP_K=20)
         ↓
Stage 2: Semantic Rerank (bge-reranker-v2-m3)
         ↓
Stage 3: MMR Diversity (lambda=0.7)
         ↓
Stage 4: LLM RAG Generation (Gemma 4 31B)
         ↓
Response (with guardrails)
```

---

## 7. Chạy ứng dụng

```bash
cd ai-v3

# Development (hot reload)
python main.py

# Hoặc dùng uvicorn trực tiếp
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Endpoints chính

| Endpoint | Method | Mô tả |
|---|---|---|
| `/` | GET | Service info |
| `/health` | GET | Health check (DB connection) |
| `/api/v1/chat?q=...` | GET/POST | RAG Chatbot |
| `/api/search?q=...` | GET | Product search (4-stage) |
| `/api/nlu/parse?q=...` | GET/POST | NLU analysis |
| `/admin` | GET | Admin dashboard UI |
| `/test` | GET | Chat test UI |
| `/docs` | GET | Swagger API docs |

---

## 8. Lưu ý khi deploy

1. **API Keys**: Không commit `.env` lên git. Sử dụng environment secrets trên server.
2. **Embedding device**: Đổi `EMBEDDING_DEVICE=cuda` nếu có GPU.
3. **DB Port**: Supabase Transaction Pooler dùng port `6543` (không phải `5432`).
4. **Google GenAI**: Sử dụng `google-genai` package (新版), KHÔNG dùng `google-generativeai` (旧版 deprecated).
5. **Windows encoding**: Thêm `sys.stdout.reconfigure(encoding="utf-8")` ở đầu script để tránh lỗi Unicode.
