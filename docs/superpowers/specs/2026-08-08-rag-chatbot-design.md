# RAG Chatbot System Design

**Date:** 2026-08-08
**Author:** KZ | Quoc Luong
**Status:** Draft

---

## 1. Overview

### 1.1 Problem Statement

Xây dựng hệ thống RAG (Retrieval-Augmented Generation) Chatbot cho website thương mại điện tử ShopWise. Hệ thống cần:

- Lấy dữ liệu sản phẩm từ Supabase PostgreSQL
- Chunking thông minh theo cấu trúc sản phẩm (thông số kỹ thuật, mô tả, FAQ, chính sách)
- Sinh embedding bằng BGE-M3 đa ngôn ngữ
- Lưu vào ChromaDB vector database + BM25 sparse index cho hybrid search
- Nhận dạng intent và NER tiếng Việt chuyên ngành điện tử (PhoBERT fine-tuned)
- Xây dựng cơ chế out-of-scope detection
- Thiết kế kiến trúc RAG pipeline hoàn chỉnh

### 1.2 Goals

- Admin có thể quản lý sản phẩm, khi thêm/sửa/xóa sản phẩm ở backend Java → tự động sync vào RAG system
- Chatbot trả lời câu hỏi dựa trên thông tin sản phẩm thực tế, không hallucinate
- Hỗ trợ 8 loại intent: hỏi thông số, so sánh, hỏi giá, hỏi bảo hành, tư vấn chọn mua, hỏi khuyến mãi, đặt hàng, khiếu nại
- Thời gian phản hồi < 2 giây cho query, < 5 giây cho ingestion

### 1.3 Non-Goals

- Không xây dựng microservices phức tạp (chỉ monolithic Python API)
- Không hỗ trợ multi-language (chỉ tiếng Việt)
- Không xây dựng admin dashboard riêng (dùng Java backend hiện có)
- Không deploy production trong phase MVP

---

## 2. Architecture

### 2.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        JAVA BACKEND (Spring Boot)                        │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │   │
│  │  │ AdminProduct     │  │ ProductService  │  │ SyncService (NEW)       │  │   │
│  │  │ Controller       │  │                 │  │ - syncToRAG(productId)  │  │   │
│  │  └─────────────────┘  └─────────────────┘  │ - deleteFromRAG(id)     │  │   │
│  │                                            └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      │ HTTP POST (async, fire-and-forget)       │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        PYTHON FASTAPI SERVER                              │   │
│  │                                                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                     API LAYER (api/routers/)                      │    │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │    │   │
│  │  │  │ /chat        │  │ /admin       │  │ /sync (NEW)          │  │    │   │
│  │  │  │ - POST /ask  │  │ - /products  │  │ - POST /product/{id} │  │    │   │
│  │  │  │              │  │              │  │ - DELETE /product/{id}│  │    │   │
│  │  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                      │                                   │   │
│  │                                      ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                   PIPELINE LAYER (services/)                     │    │   │
│  │  │                                                                   │    │   │
│  │  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │    │   │
│  │  │  │  Ingestion   │    │  Retrieval   │    │  Generation  │         │    │   │
│  │  │  │  Pipeline    │    │  Pipeline    │    │  Pipeline    │         │    │   │
│  │  │  │              │    │              │    │              │         │    │   │
│  │  │  │ 1. Fetch DB  │    │ 1. Intent    │    │ 1. Prompt    │         │    │   │
│  │  │  │ 2. Chunk     │    │ 2. NER       │    │ 2. LLM Call  │         │    │   │
│  │  │  │ 3. Embed     │    │ 3. Hybrid    │    │ 3. Validate  │         │    │   │
│  │  │  │ 4. Index     │    │    Search    │    │ 4. Format    │         │    │   │
│  │  │  │              │    │ 4. Rerank    │    │              │         │    │   │
│  │  │  └─────────────┘    └─────────────┘    └─────────────┘         │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                      │                                   │   │
│  │                                      ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    STORAGE LAYER (indexing/)                      │    │   │
│  │  │  ┌─────────────────┐              ┌─────────────────┐           │    │   │
│  │  │  │   ChromaDB      │              │   BM25 Index    │           │    │   │
│  │  │  │ (Dense Vector)  │              │ (Sparse Lexical)│           │    │   │
│  │  │  └─────────────────┘              └─────────────────┘           │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Ingestion Flow (Real-time Sync):**
1. Admin tạo/sửa sản phẩm → Java Backend gọi `POST /sync/product/{id}`
2. Python fetch sản phẩm từ DB → Chunking → Embedding → Index vào ChromaDB + BM25
3. Response `202 Accepted` ngay, xử lý async trong background

**Query Flow (User Chat):**
1. User gửi câu hỏi → `POST /chat/ask`
2. Intent Classification + NER Extraction
3. Hybrid Retrieval (ChromaDB + BM25) → RRF Fusion → Reranking
4. LLM Generation → Response Validation → Trả về cho user

---

## 3. Chunking Strategy

### 3.1 Chunk Types

Mỗi sản phẩm được chunk thành 4 loại:

| Chunk Type | Mục đích | Ví dụ |
|------------|----------|-------|
| `spec` | Thông số kỹ thuật, giá cả | "Laptop ASUS ROG Strix G16 \| CPU: Intel Core i9-14900HX \| RAM: 32GB DDR5 \| GPU: NVIDIA RTX 4070 \| Giá: 42.990.000₫" |
| `description` | Mô tả sản phẩm | "Laptop ASUS ROG Strix G16 là laptop gaming cao cấp với thiết kế hầm hố..." |
| `faq` | Câu hỏi thường gặp | "Q: Laptop có chơi được game AAA không? A: Có, với RTX 4070..." |
| `policy` | Chính sách bảo hành, đổi trả | "Chính sách bảo hành: 24 tháng chính hãng ASUS..." |

### 3.2 Chunk ID Format

```
{product_id}_{chunk_type}_{index}
```

Ví dụ: `uuid-xxx_spec_0`, `uuid-xxx_description_0`, `uuid-xxx_faq_0`

### 3.3 Chunk Metadata

```python
{
    "product_id": "uuid-xxx",
    "chunk_type": "spec",  # spec|description|faq|policy
    "product_name": "ASUS ROG Strix G16",
    "brand": "ASUS",
    "category": "Laptop Gaming",
    "price": 42990000
}
```

---

## 4. NLU (Natural Language Understanding)

### 4.1 Intent Classification

**Model:** `souta04/phobert-electronics-e-commerce-nlu` (fine-tuned PhoBERT)

**8 Intent Types:**

| Intent | Mô tả | Ví dụ |
|--------|-------|-------|
| `spec_query` | Hỏi thông số kỹ thuật | "Laptop này RAM bao nhiêu?" |
| `price_query` | Hỏi giá | "Giá laptop ASUS ROG bao nhiêu?" |
| `comparison_query` | So sánh sản phẩm | "So sánh ASUS ROG vs MSI Raider" |
| `warranty_query` | Hỏi bảo hành | "Bảo hành bao lâu?" |
| `purchase_advice` | Tư vấn chọn mua | "Tư vấn laptop gaming 40 triệu" |
| `promotion_query` | Hỏi khuyến mãi | "Có giảm giá không?" |
| `order_query` | Đặt hàng | "Mua laptop này ở đâu?" |
| `complaint_query` | Khiếu nại | "Laptop bị lỗi phải làm sao?" |
| `out_of_scope` | Ngoài phạm vi | "Thời tiết hôm nay thế nào?" |

**Confidence Threshold:** 0.45 (dưới ngưỡng này → out_of_scope)

### 4.2 NER Extraction

**Approach:** Rule-based + Pattern matching

**Entities cần extract:**
- `brand`: Tên hãng (ASUS, Dell, HP, Lenovo, MSI, Acer, Apple...)
- `product_name`: Tên sản phẩm cụ thể
- `spec_attribute`: Thông số được hỏi (RAM, CPU, GPU, Storage, Display...)
- `price_range`: Khoảng giá (nếu có)
- `category`: Danh mục sản phẩm

### 4.3 Out-of-Scope Detection

Điều kiện bị từ chối:
1. Intent confidence < 0.45
2. Intent = `out_of_scope`
3. Không detect được product/brand trong câu hỏi
4. Câu hỏi về chủ đề không liên quan (chính trị, tôn giáo...)
5. Retrieval trả về 0 kết quả

---

## 5. Retrieval Pipeline

### 5.1 Hybrid Retrieval

Kết hợp Dense Search (ChromaDB) và Sparse Search (BM25) sử dụng Reciprocal Rank Fusion (RRF).

**RRF Formula:**
```
score(d) = Σ 1/(k + rank_i + 1)
```

Trong đó:
- `k = 60` (constant)
- `rank_i` = thứ hạng của document trong mỗi search result

### 5.2 Intent → Retrieval Strategy

| Intent | Preferred Chunks | Search Strategy |
|--------|------------------|-----------------|
| `spec_query` | `["spec"]` | Exact product + spec attribute |
| `price_query` | `["spec"]` | Exact product, price in spec |
| `comparison_query` | `["spec","description"]` | Multiple products, no filter |
| `warranty_query` | `["policy","faq"]` | Exact product, policy chunks |
| `purchase_advice` | `["description","spec"]` | Category filter + use_case |
| `promotion_query` | `["spec","faq"]` | Price/campaign related |
| `order_query` | `["faq"]` | Order process questions |
| `complaint_query` | `["faq","policy"]` | Support/warranty process |

### 5.3 Reranking

**Model:** `BAAI/bge-reranker-v2-m3`

- Input: 20 kết quả từ hybrid retrieval
- Output: Top 5 kết quả reranked theo relevance score

---

## 6. Generation Pipeline

### 6.1 Prompt Strategy

**System Prompt (chung):**
```
Bạn là trợ lý AI tư vấn sản phẩm điện tử của ShopWise.
Nhiệm vụ: trả lời câu hỏi của khách hàng dựa trên thông tin sản phẩm được cung cấp.

Quy tắc:
- Chỉ trả lời dựa trên thông tin trong context, không bịa
- Nếu không có thông tin, nói 'Tôi không có thông tin về...'
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu
- Luôn mention tên sản phẩm đầy đủ
- Format giá: XX.XXX.XXX₫
- Không trả lời câu hỏi ngoài phạm vi sản phẩm điện tử
```

**Template theo Intent:**
- `spec_query`: Focus vào thông số kỹ thuật, liệt kê tất cả variants
- `comparison_query`: Bảng so sánh, nhận xét khách quan
- `purchase_advice`: 2-3 sản phẩm đề xuất, lý do đề xuất
- Các intent khác: Template phù hợp với mục đích

### 6.2 LLM Configuration

**Provider:** Google Gemini 1.5 Flash

```python
{
    "temperature": 0.2,
    "max_output_tokens": 1024,
    "top_p": 0.9
}
```

**Fallback chain:**
1. Google Gemini (primary)
2. OpenAI GPT-4o-mini (if Gemini fails)
3. Mock response (for dev/testing)

### 6.3 Response Validation

**Checks:**
1. **Hallucination Check:** So sánh response với context chunks
2. **Relevance Check:** Response có trả lời đúng câu hỏi không
3. **Format Check:** Giá format đúng, không markdown thừa
4. **Safety Check:** Không toxic/offensive

---

## 7. API Design

### 7.1 Sync Endpoints (Java → Python)

#### POST /sync/product/{product_id}

```http
POST /sync/product/{product_id}
Headers: X-API-Key: {secret}

Response 202:
{
    "status": "accepted",
    "task_id": "task_abc123",
    "message": "Product ingestion started"
}
```

#### DELETE /sync/product/{product_id}

```http
DELETE /sync/product/{product_id}
Headers: X-API-Key: {secret}

Response 200:
{
    "status": "deleted",
    "chunks_deleted": 4,
    "message": "Product removed from index"
}
```

#### GET /sync/status/{task_id}

```http
GET /sync/status/{task_id}

Response 200:
{
    "task_id": "task_abc123",
    "status": "completed",  // pending|processing|completed|failed
    "product_id": "uuid-xxx",
    "chunks_created": 4,
    "duration_ms": 2340,
    "error": null
}
```

### 7.2 Chat Endpoints (Frontend → Python)

#### POST /chat/ask

```http
POST /chat/ask
Content-Type: application/json

{
    "message": "Laptop ASUS ROG có RAM bao nhiêu?",
    "session_id": "session_xyz",
    "user_id": "user_123"
}

Response 200:
{
    "answer": "Laptop ASUS ROG Strix G16 có RAM 32GB DDR5...",
    "intent": "spec_query",
    "confidence": 0.92,
    "sources": [
        {
            "product_id": "uuid-xxx",
            "product_name": "ASUS ROG Strix G16",
            "chunk_type": "spec",
            "relevance_score": 0.95
        }
    ],
    "session_id": "session_xyz"
}
```

### 7.3 Admin Endpoints

#### GET /admin/stats

```http
GET /admin/stats

Response 200:
{
    "total_products": 150,
    "total_chunks": 600,
    "index_size_mb": 45.2,
    "last_sync": "2026-08-08T10:30:00Z",
    "pending_tasks": 0
}
```

#### POST /admin/reindex

```http
POST /admin/reindex

Response 202:
{
    "status": "started",
    "total_products": 150,
    "estimated_time_minutes": 10
}
```

---

## 8. Java Backend Integration

### 8.1 SyncService

```java
@Service
public class SyncService {

    @Value("${rag.api.url}")
    private String ragApiUrl;

    @Value("${rag.api.key}")
    private String ragApiKey;

    private final RestTemplate restTemplate;

    @Async
    public void syncProductToRAG(UUID productId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", ragApiKey);

            HttpEntity<?> entity = new HttpEntity<>(headers);
            String url = ragApiUrl + "/sync/product/" + productId;

            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, Map.class
            );

            log.info("RAG sync started for product {}: {}", productId, response.getBody());
        } catch (Exception e) {
            log.error("RAG sync failed for product {}: {}", productId, e.getMessage());
            // Không throw - sync failure không block admin CRUD
        }
    }

    @Async
    public void deleteProductFromRAG(UUID productId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", ragApiKey);

            HttpEntity<?> entity = new HttpEntity<>(headers);
            String url = ragApiUrl + "/sync/product/" + productId;

            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.DELETE, entity, Map.class
            );

            log.info("RAG delete completed for product {}: {}", productId, response.getBody());
        } catch (Exception e) {
            log.error("RAG delete failed for product {}: {}", productId, e.getMessage());
            // Không throw - delete failure không block admin CRUD
        }
    }
}
```

### 8.2 Integration Points

```java
// Sau khi create product thành công
public ProductDetailResponse create(ProductAdminRequest request) {
    Product product = ...;  // save to DB
    syncService.syncProductToRAG(product.getId());  // async call
    return toResponse(product);
}

// Sau khi update product thành công
public ProductDetailResponse update(UUID id, ProductAdminRequest req) {
    Product product = ...;  // update DB
    syncService.syncProductToRAG(id);  // re-index
    return toResponse(product);
}

// Sau khi setActive(false)
public ProductDetailResponse setActive(UUID id, boolean active) {
    Product product = ...;
    if (!active) {
        syncService.deleteProductFromRAG(id);  // remove from index
    } else {
        syncService.syncProductToRAG(id);  // re-index
    }
    return toResponse(product);
}
```

### 8.3 Configuration

**application.yml:**
```yaml
rag:
  api:
    url: http://localhost:8000
    key: your-secret-key
```

---

## 9. Project Structure

### 9.1 Python AI System

```
ai-system/
├── api/                                    # FastAPI API Layer
│   ├── main.py                            # App entry point
│   ├── schemas.py                         # Pydantic models
│   ├── middleware.py              (NEW)   # API key auth
│   └── routers/
│       ├── chat.py                        # POST /chat/ask
│       ├── admin_products.py              # Admin endpoints
│       ├── sync.py                (NEW)   # Sync endpoints
│       └── stage_testing.py               # Dev testing
│
├── config/                                  # Configuration
│   ├── settings.py                        # Settings from .env
│   └── constants.py                       # Intent labels
│
├── db/                                      # Database Access
│   ├── database.py                        # SQLAlchemy async
│   ├── db.py                              # psycopg2 sync
│   ├── models.py                          # SQLAlchemy models
│   └── product_repository.py    (UPDATE)  # Fetch by ID
│
├── data_pipeline/                           # Data Processing
│   └── chunking/
│       ├── chunk_schema.py                # Chunk dataclass
│       └── chunk_orchestrator.py(UPDATE)  # Smart chunking
│
├── embedding/                               # Embedding Models
│   ├── bge_m3_encoder.py                  # BGE-M3 encoder
│   └── batch_embedder.py                  # Batch encoding
│
├── nlu/                                     # NLU
│   ├── intent_classifier.py               # PhoBERT classifier
│   ├── ner_extractor.py                   # NER extraction
│   ├── out_of_scope_detector.py           # OOS detection
│   └── query_processor.py       (UPDATE)  # Orchestrator
│
├── indexing/                                # Index Layer
│   ├── vector_store.py                    # ChromaDB ops
│   ├── bm25_index.py                      # BM25 ops
│   └── hybrid_indexer.py        (UPDATE)  # Orchestrator
│
├── retrieval/                               # Retrieval
│   ├── query_builder.py                   # Build query
│   ├── hybrid_retriever.py                # Hybrid search
│   └── reranker.py                        # Reranking
│
├── generation/                              # Generation
│   ├── prompt_builder.py                  # Build prompt
│   ├── llm_client.py                      # LLM client
│   └── response_validator.py              # Validation
│
├── services/                                # Business Logic
│   ├── product_service.py                 # Existing
│   ├── ingestion_service.py      (NEW)   # Ingestion orchestrator
│   ├── chat_service.py           (NEW)   # Chat orchestrator
│   └── task_manager.py           (NEW)   # Task tracking
│
├── tests/                                   # Tests
│   ├── test_chunking.py           (NEW)
│   ├── test_retrieval.py          (NEW)
│   ├── test_generation.py         (NEW)
│   └── test_sync_api.py           (NEW)
│
└── requirements.txt
```

### 9.2 Java Backend (New Files)

```
backend/src/main/java/ptithcm/tttnd35backend/
├── service/
│   ├── ISyncService.java           (NEW)
│   └── impl/SyncService.java       (NEW)
├── config/
│   ├── AsyncConfig.java            (NEW)
│   └── RestTemplateConfig.java     (NEW)
└── resources/
    └── application.yml            (UPDATE)
```

---

## 10. Implementation Phases

### Phase 1: Core Foundation (Tuần 1)

**Priority:** CAO

- [ ] 1.1 Setup project structure
- [ ] 1.2 Cấu hình .env
- [ ] 1.3 Implement api/middleware.py (API key auth)
- [ ] 1.4 Implement db/product_repository.py (fetch by ID)
- [ ] 1.5 Implement services/task_manager.py
- [ ] 1.6 Viết unit tests

### Phase 2: Ingestion Pipeline (Tuần 1-2)

**Priority:** CAO

- [ ] 2.1 Implement chunk_orchestrator.py (smart chunking)
- [ ] 2.2 Implement ingestion_service.py (orchestrator)
- [ ] 2.3 Update hybrid_indexer.py (upsert/delete)
- [ ] 2.4 Implement api/routers/sync.py
- [ ] 2.5 Update api/main.py
- [ ] 2.6 Viết integration tests

### Phase 3: Java Backend Integration (Tuần 2)

**Priority:** CAO

- [ ] 3.1 Tạo SyncService (interface + implementation)
- [ ] 3.2 Tạo AsyncConfig
- [ ] 3.3 Tạo RestTemplateConfig
- [ ] 3.4 Update ProductService.java
- [ ] 3.5 Update application.yml
- [ ] 3.6 Test end-to-end

### Phase 4: Query Pipeline Enhancement (Tuần 2-3)

**Priority:** TRUNG BÌNH

- [ ] 4.1 Cải thiện ner_extractor.py
- [ ] 4.2 Cải thiện query_builder.py
- [ ] 4.3 Cải thiện query_processor.py
- [ ] 4.4 Viết tests

### Phase 5: Chat Pipeline & Testing (Tuần 3)

**Priority:** TRUNG BÌNH

- [ ] 5.1 Implement chat_service.py
- [ ] 5.2 Update api/routers/chat.py
- [ ] 5.3 Cải thiện prompt_builder.py
- [ ] 5.4 Cải thiện response_validator.py
- [ ] 5.5 End-to-end testing

### Phase 6: Polish & Optimization (Tuần 3-4)

**Priority:** THẤP

- [ ] 6.1 Implement admin stats endpoint
- [ ] 6.2 Implement reindex endpoint
- [ ] 6.3 Performance optimization
- [ ] 6.4 Error handling improvements
- [ ] 6.5 Documentation
- [ ] 6.6 Final testing

---

## 11. Configuration

### 11.1 Environment Variables (.env)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://...@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres

# Vector DB
CHROMA_PERSIST_DIR=./chroma_data

# Embedding
EMBEDDING_MODEL_NAME=BAAI/bge-m3
EMBEDDING_DEVICE=cpu

# LLM
LLM_PROVIDER=google
LLM_API_KEY=your-gemini-api-key

# Security
RAG_SYNC_API_KEY=your-secret-key
```

### 11.2 Settings Class

```python
class Settings:
    # Database
    DATABASE_URL: str
    DB_HOST: str
    DB_PORT: str
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    # Vector DB
    CHROMA_PERSIST_DIR: str
    CHROMA_COLLECTION_NAME: str

    # BM25
    BM25_INDEX_DIR: str

    # Embedding
    EMBEDDING_MODEL_NAME: str
    EMBEDDING_BATCH_SIZE: int
    EMBEDDING_DEVICE: str

    # Chunking
    MAX_CHUNK_TOKENS: int

    # Retrieval
    RERANKER_MODEL_NAME: str
    RERANKER_DEVICE: str
    RRF_K: int
    RETRIEVAL_TOP_K: int
    RERANK_TOP_K: int

    # LLM
    LLM_PROVIDER: str
    LLM_MODEL_NAME: str
    LLM_API_KEY: str
    LLM_TEMPERATURE: float

    # App
    APP_ENV: str
    LOG_LEVEL: str
```

---

## 12. Dependencies

### 12.1 Python (requirements.txt)

```txt
# Web framework
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic>=2.9.2

# Database
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
psycopg2-binary

# Vector DB
chromadb>=0.4.24

# Sparse search
rank_bm25==0.2.2

# Embedding model
FlagEmbedding==1.2.11
torch>=2.0.0

# NLU
transformers

# Text cleaning
bleach==6.1.0

# HTTP client (for Java backend)
httpx

# Dev/test
pytest==8.3.3
pytest-asyncio==0.24.0
```

---

## 13. Success Criteria

### 13.1 Functional Requirements

- [ ] Admin tạo sản phẩm → tự động sync vào RAG trong < 5 giây
- [ ] Admin ẩn sản phẩm → tự động xóa khỏi RAG index
- [ ] Chatbot trả lời đúng 8 loại intent
- [ ] Out-of-scope questions bị từ chối
- [ ] Không hallucinate (chỉ trả lời dựa trên context)

### 13.2 Non-Functional Requirements

- [ ] Query response time < 2 giây
- [ ] Ingestion time < 5 giây/sản phẩm
- [ ] API availability > 99% (trong dev environment)
- [ ] Code coverage > 70%

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| BGE-M3 slow on CPU | High | Batch embedding, cache embeddings |
| ChromaDB embedded mode limits | Medium | Plan migration to Qdrant if needed |
| PhoBERT accuracy | Medium | Fine-tune with more data, fallback to rule-based |
| LLM hallucination | High | Strict prompt, response validation |
| Sync failure | Medium | Retry logic, task status tracking |

---

## 15. Future Enhancements

- [ ] Migrate to Qdrant for distributed vector DB
- [ ] Add Celery for async task processing
- [ ] Implement chat history/context
- [ ] Add analytics dashboard
- [ ] Support multi-language
- [ ] Implement A/B testing for prompts
- [ ] Add caching layer (Redis)

---

**End of Design Document**
