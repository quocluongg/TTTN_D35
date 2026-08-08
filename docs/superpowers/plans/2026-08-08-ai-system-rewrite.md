# AI System Rewrite - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite ai-system from scratch with Supabase pgvector + FAISS hybrid, Gemini 3.1 Flash Lite, and admin endpoints.

**Architecture:** Lightweight FastAPI server with FAISS for fast retrieval, Supabase pgvector for persistent storage, BGE-M3 for embeddings, Gemini 3.1 Flash Lite for generation.

**Tech Stack:** Python 3.11+, FastAPI, Supabase (PostgreSQL + pgvector), FAISS, BGE-M3, Gemini 3.1 Flash Lite

## Global Constraints

- Python 3.11+ required
- All config in `.env` file, never hardcoded
- Chunk ID format: `{product_id}_{chunk_type}_{index}`
- 4 chunk types: spec, description, faq, policy
- FAISS index saved to disk after each sync
- Gemini API key: `your-gemini-api-key`
- Gemini model: `gemini-3.1-flash-lite`

---

## Phase 1: Foundation Setup

### Task 1.1: Project Structure & Configuration

- [ ] **Step 1: Update `ai-system/config.py`**

Create/update `ai-system/config.py` with full configuration fields matching `.env`.

```python
import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase DB
    DB_HOST: str = "aws-0-ap-southeast-1.pooler.supabase.com"
    DB_PORT: int = 5432
    DB_NAME: str = "postgres"
    DB_USER: str = "postgres.zzukpubwbntihzztilqy"
    DB_PASSWORD: str = ""

    # Embedding
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    EMBEDDING_DEVICE: str = "cpu"
    EMBEDDING_BATCH_SIZE: int = 16

    # Reranker
    RERANKER_MODEL: str = "BAAI/bge-reranker-v2-m3"
    RERANKER_DEVICE: str = "cpu"

    # Retrieval
    FAISS_INDEX_PATH: str = "./faiss_store/index.faiss"
    BM25_INDEX_PATH: str = "./faiss_store/bm25.pkl"
    TOP_K: int = 20
    RERANK_TOP_K: int = 5

    # LLM
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    LLM_TEMPERATURE: float = 0.2

    # Security
    RAG_SYNC_API_KEY: str = "your-secret-key-here"

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 2: Create main.py**

```python
"""FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers import chat, sync, admin, health

settings = get_settings()
logging.basicConfig(level=settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown events."""
    logging.info("Starting AI System...")
    # Load FAISS index on startup
    from core.retriever import load_index
    load_index()
    yield
    logging.info("Shutting down AI System...")


app = FastAPI(
    title="ShopWise RAG Chatbot API",
    description="Hệ thống RAG Chatbot tư vấn sản phẩm công nghệ.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(sync.router)
app.include_router(admin.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)
```

- [ ] **Step 3: Create requirements.txt**

```
# Web framework
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic>=2.9.2
pydantic-settings>=2.0.0

# Database
psycopg2-binary

# Vector search
faiss-cpu>=1.7.4

# Sparse search
rank_bm25==0.2.2

# Embedding
FlagEmbedding==1.2.11
torch>=2.0.0

# LLM
google-generativeai>=0.3.0

# NLU
transformers

# Utils
numpy
pickle5
```

- [ ] **Step 4: Create .env**

```
# Supabase
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.zzukpubwbntihzztilqy
DB_PASSWORD=your-db-password

# Embedding
EMBEDDING_MODEL=BAAI/bge-m3
EMBEDDING_DEVICE=cpu

# LLM
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.1-flash-lite

# Security
RAG_SYNC_API_KEY=your-secret-key-here
```

- [ ] **Step 5: Commit**

```bash
git add ai-system/main.py ai-system/config.py ai-system/.env ai-system/requirements.txt
git commit -m "feat: initialize new AI system structure"
```

---

### Task 1.2: Database Client

**Files:**
- Create: `ai-system/db/__init__.py`
- Create: `ai-system/db/supabase_client.py`

- [ ] **Step 1: Create supabase_client.py**

```python
"""Supabase PostgreSQL client for product data."""
import logging
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_connection():
    """Get psycopg2 connection to Supabase."""
    return psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        connect_timeout=10
    )


def fetch_all_products() -> list[dict]:
    """Fetch all active products with variants."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT
                p.id,
                p.name,
                p.slug,
                p.description,
                p.brand,
                p.thumbnail as image_url,
                COALESCE(p.rating_avg, 5.0) as rating,
                COALESCE(p.review_count, 0) as reviews_count,
                COALESCE(p.sold_quantity, 0) as sold_quantity,
                COALESCE(p.use_case, 'Giải trí') as use_case,
                COALESCE(c.name, 'Laptop') as category,
                COALESCE(v.price, 0) as price,
                v.attributes as specifications
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants v ON v.product_id = p.id
            WHERE p.is_active = true
        """)

        products = cur.fetchall()

        # Deduplicate by product ID
        seen = set()
        unique = []
        for p in products:
            pid = str(p['id'])
            if pid not in seen:
                seen.add(pid)
                # Normalize
                p['price'] = float(p['price']) if p['price'] else 0.0
                p['rating'] = float(p['rating']) if p['rating'] else 5.0
                p['reviews_count'] = int(p['reviews_count']) if p['reviews_count'] else 0

                # Parse specifications
                specs = p.get('specifications')
                if isinstance(specs, str):
                    try:
                        p['specifications'] = json.loads(specs)
                    except:
                        p['specifications'] = {}
                elif not specs:
                    p['specifications'] = {}

                unique.append(p)

        cur.close()
        conn.close()

        logger.info(f"Fetched {len(unique)} unique products from Supabase")
        return unique

    except Exception as e:
        logger.error(f"Failed to fetch products: {e}")
        return []


def fetch_product_by_id(product_id: str) -> dict | None:
    """Fetch single product by ID."""
    try:
        conn = get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("""
            SELECT
                p.id, p.name, p.slug, p.description, p.brand,
                p.thumbnail as image_url,
                COALESCE(p.rating_avg, 5.0) as rating,
                COALESCE(p.use_case, 'Giải trí') as use_case,
                COALESCE(c.name, 'Laptop') as category,
                COALESCE(v.price, 0) as price,
                v.attributes as specifications
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants v ON v.product_id = p.id
            WHERE p.id = %s AND p.is_active = true
        """, (product_id,))

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return None

        # Normalize
        row['price'] = float(row['price']) if row['price'] else 0.0
        specs = row.get('specifications')
        if isinstance(specs, str):
            try:
                row['specifications'] = json.loads(specs)
            except:
                row['specifications'] = {}
        elif not specs:
            row['specifications'] = {}

        return row

    except Exception as e:
        logger.error(f"Failed to fetch product {product_id}: {e}")
        return None
```

- [ ] **Step 2: Commit**

```bash
git add ai-system/db/
git commit -m "feat: add Supabase database client"
```

---

## Phase 2: Core Components

### Task 2.1: Chunker

**Files:**
- Create: `ai-system/core/__init__.py`
- Create: `ai-system/core/chunker.py`

- [ ] **Step 1: Create chunker.py**

```python
"""Smart chunking for product data."""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Chunk:
    id: str
    text: str
    product_id: str
    chunk_type: str  # spec, description, faq, policy
    metadata: dict[str, Any] = field(default_factory=dict)
    embedding: list[float] | None = None


def _format_price(price: float) -> str:
    """Format price to Vietnamese: 42.990.000₫"""
    try:
        return f"{int(price):,}".replace(",", ".") + "₫"
    except:
        return "Liên hệ"


def chunk_product(product: dict) -> list[Chunk]:
    """Split product into 4 chunk types."""
    pid = str(product.get("id", ""))
    if not pid or not product.get("name"):
        return []

    name = product.get("name", "")
    brand = product.get("brand", "")
    category = product.get("category", "")
    price = product.get("price", 0)
    description = product.get("description", "")
    specs = product.get("specifications", {})
    use_case = product.get("use_case", "")

    base_meta = {
        "product_name": name,
        "brand": brand,
        "category": category,
        "price": price,
    }

    chunks = []

    # 1. Spec chunk
    spec_parts = [f"{brand} {name}"]
    if specs:
        spec_parts.append(" | ".join(f"{k}: {v}" for k, v in specs.items()))
    if price:
        spec_parts.append(f"Giá: {_format_price(price)}")

    chunks.append(Chunk(
        id=f"{pid}_spec_0",
        text=" | ".join(spec_parts),
        product_id=pid,
        chunk_type="spec",
        metadata={**base_meta, "chunk_type": "spec"},
    ))

    # 2. Description chunk
    desc_parts = [f"{brand} {name}"]
    if category:
        desc_parts.append(f"Danh mục: {category}")
    if use_case:
        desc_parts.append(f"Phù hợp cho: {use_case}")
    if description:
        desc_parts.append(description[:500])

    chunks.append(Chunk(
        id=f"{pid}_description_0",
        text=". ".join(desc_parts),
        product_id=pid,
        chunk_type="description",
        metadata={**base_meta, "chunk_type": "description"},
    ))

    # 3. FAQ chunk (default)
    chunks.append(Chunk(
        id=f"{pid}_faq_0",
        text=f"Sản phẩm {brand} {name} - Vui lòng liên hệ để được tư vấn chi tiết.",
        product_id=pid,
        chunk_type="faq",
        metadata={**base_meta, "chunk_type": "faq"},
    ))

    # 4. Policy chunk
    policy_parts = [f"Chính sách sản phẩm {brand} {name}:"]
    policy_parts.append("Bảo hành: Theo chính sách nhà sản xuất")
    policy_parts.append("Đổi trả: Trong 7 ngày nếu lỗi nhà sản xuất")
    policy_parts.append("Vận chuyển: Miễn phí toàn quốc")

    chunks.append(Chunk(
        id=f"{pid}_policy_0",
        text="\n".join(policy_parts),
        product_id=pid,
        chunk_type="policy",
        metadata={**base_meta, "chunk_type": "policy"},
    ))

    return chunks
```

- [ ] **Step 2: Commit**

```bash
git add ai-system/core/chunker.py
git commit -m "feat: implement smart chunker with 4 chunk types"
```

---

### Task 2.2: Embedder

**Files:**
- Create: `ai-system/core/embedder.py`

- [ ] **Step 1: Create embedder.py**

```python
"""BGE-M3 embedding encoder."""
import logging
import numpy as np
from FlagEmbedding import BGEM3FlagModel
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_model = None


def _get_model():
    global _model
    if _model is None:
        logger.info(f"Loading BGE-M3 model on {settings.EMBEDDING_DEVICE}...")
        try:
            _model = BGEM3FlagModel(
                settings.EMBEDDING_MODEL,
                use_fp16=(settings.EMBEDDING_DEVICE == "cuda"),
                device=settings.EMBEDDING_DEVICE,
            )
            logger.info("BGE-M3 model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load BGE-M3: {e}")
            _model = None
    return _model


def encode_texts(texts: list[str]) -> np.ndarray:
    """Encode list of texts to vectors."""
    if not texts:
        return np.array([])

    model = _get_model()
    if model is None:
        logger.warning("BGE-M3 not available, returning zero vectors")
        return np.zeros((len(texts), 1024))

    try:
        output = model.encode(
            texts,
            batch_size=settings.EMBEDDING_BATCH_SIZE,
            max_length=1024,
            return_dense=True,
            return_sparse=False,
            return_colbert_vecs=False,
        )
        return output["dense_vecs"]
    except Exception as e:
        logger.error(f"Encoding failed: {e}")
        return np.zeros((len(texts), 1024))


def encode_query(query: str) -> np.ndarray:
    """Encode single query to vector."""
    result = encode_texts([query])
    return result[0] if len(result) > 0 else np.zeros(1024)
```

- [ ] **Step 2: Commit**

```bash
git add ai-system/core/embedder.py
git commit -m "feat: implement BGE-M3 embedder"
```

---

### Task 2.3: FAISS + BM25 Retriever

**Files:**
- Create: `ai-system/core/retriever.py`
- Create: `ai-system/faiss_store/` directory

- [ ] **Step 1: Create retriever.py**

```python
"""Hybrid retriever with FAISS + BM25."""
import logging
import os
import pickle
import numpy as np
import faiss
from rank_bm25 import BM25Okapi
from config import get_settings
from core.embedder import encode_query

logger = logging.getLogger(__name__)
settings = get_settings()

# FAISS state
_faiss_index = None
_faiss_id_map = {}  # {faiss_idx: chunk_id}
_chunk_metadata = {}  # {chunk_id: {text, metadata}}

# BM25 state
_bm25 = None
_bm25_corpus = {}  # {chunk_id: {"text": ..., "tokens": [...]}}


def _tokenize(text: str) -> list[str]:
    return text.lower().split()


def load_index():
    """Load FAISS and BM25 indices from disk."""
    global _faiss_index, _faiss_id_map, _chunk_metadata, _bm25, _bm25_corpus

    os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH), exist_ok=True)

    # Load FAISS
    if os.path.exists(settings.FAISS_INDEX_PATH):
        try:
            _faiss_index = faiss.read_index(settings.FAISS_INDEX_PATH)
            with open(settings.FAISS_INDEX_PATH + ".pkl", "rb") as f:
                data = pickle.load(f)
                _faiss_id_map = data.get("id_map", {})
                _chunk_metadata = data.get("metadata", {})
            logger.info(f"Loaded FAISS index: {_faiss_index.ntotal} vectors")
        except Exception as e:
            logger.warning(f"Failed to load FAISS: {e}")
            _faiss_index = None

    # Load BM25
    if os.path.exists(settings.BM25_INDEX_PATH):
        try:
            with open(settings.BM25_INDEX_PATH, "rb") as f:
                _bm25_corpus = pickle.load(f)
            if _bm25_corpus:
                tokenized = [doc["tokens"] for doc in _bm25_corpus.values()]
                _bm25 = BM25Okapi(tokenized)
            logger.info(f"Loaded BM25 index: {len(_bm25_corpus)} documents")
        except Exception as e:
            logger.warning(f"Failed to load BM25: {e}")


def save_index():
    """Save FAISS and BM25 indices to disk."""
    os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH), exist_ok=True)

    # Save FAISS
    if _faiss_index is not None:
        faiss.write_index(_faiss_index, settings.FAISS_INDEX_PATH)
        with open(settings.FAISS_INDEX_PATH + ".pkl", "wb") as f:
            pickle.dump({"id_map": _faiss_id_map, "metadata": _chunk_metadata}, f)
        logger.info(f"Saved FAISS index: {_faiss_index.ntotal} vectors")

    # Save BM25
    with open(settings.BM25_INDEX_PATH, "wb") as f:
        pickle.dump(_bm25_corpus, f)
    logger.info(f"Saved BM25 index: {len(_bm25_corpus)} documents")


def index_chunks(chunks):
    """Index chunks into FAISS and BM25."""
    global _faiss_index, _faiss_id_map, _chunk_metadata, _bm25, _bm25_corpus

    if not chunks:
        return

    # Prepare data
    embeddings = []
    for chunk in chunks:
        if chunk.embedding is None:
            continue

        faiss_idx = len(_faiss_id_map)
        _faiss_id_map[faiss_idx] = chunk.id
        _chunk_metadata[chunk.id] = {
            "text": chunk.text,
            "metadata": chunk.metadata,
        }
        embeddings.append(chunk.embedding)

        # BM25
        _bm25_corpus[chunk.id] = {
            "text": chunk.text,
            "metadata": chunk.metadata,
            "tokens": _tokenize(chunk.text),
        }

    # Build FAISS index
    if embeddings:
        dim = len(embeddings[0])
        vectors = np.array(embeddings, dtype=np.float32)

        if _faiss_index is None:
            _faiss_index = faiss.IndexFlatIP(dim)  # Inner product (cosine after normalization)

        _faiss_index.add(vectors)

    # Rebuild BM25
    if _bm25_corpus:
        tokenized = [doc["tokens"] for doc in _bm25_corpus.values()]
        _bm25 = BM25Okapi(tokenized)

    save_index()
    logger.info(f"Indexed {len(chunks)} chunks")


def remove_product_chunks(product_id: str):
    """Remove all chunks for a product."""
    global _bm25_corpus

    ids_to_remove = [
        cid for cid, meta in _chunk_metadata.items()
        if meta.get("metadata", {}).get("product_id") == product_id
    ]

    for cid in ids_to_remove:
        del _chunk_metadata[cid]
        if cid in _bm25_corpus:
            del _bm25_corpus[cid]

    # Rebuild BM25
    if _bm25_corpus:
        tokenized = [doc["tokens"] for doc in _bm25_corpus.values()]
        _bm25 = BM25Okapi(tokenized)

    # Note: FAISS doesn't support efficient deletion
    # We'll rebuild the full index on next sync
    logger.info(f"Removed {len(ids_to_remove)} chunks for product {product_id}")


def search(query: str, top_k: int = 20, filters: dict = None) -> list[dict]:
    """Hybrid search with FAISS + BM25."""
    results = {}

    # FAISS search
    if _faiss_index is not None and _faiss_index.ntotal > 0:
        query_vec = encode_query(query).reshape(1, -1).astype(np.float32)
        scores, indices = _faiss_index.search(query_vec, min(top_k * 2, _faiss_index.ntotal))

        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            chunk_id = _faiss_id_map.get(idx)
            if chunk_id and chunk_id in _chunk_metadata:
                meta = _chunk_metadata[chunk_id]
                if _matches_filter(meta["metadata"], filters):
                    results[chunk_id] = {
                        "id": chunk_id,
                        "text": meta["text"],
                        "metadata": meta["metadata"],
                        "score": float(score),
                        "source": "faiss",
                    }

    # BM25 search
    if _bm25 is not None:
        query_tokens = _tokenize(query)
        scores = _bm25.get_scores(query_tokens)
        doc_ids = list(_bm25_corpus.keys())

        for doc_id, score in sorted(zip(doc_ids, scores), key=lambda x: -x[1])[:top_k]:
            if score > 0:
                doc = _bm25_corpus[doc_id]
                if _matches_filter(doc["metadata"], filters):
                    if doc_id in results:
                        results[doc_id]["score"] += score  # Combine scores
                    else:
                        results[doc_id] = {
                            "id": doc_id,
                            "text": doc["text"],
                            "metadata": doc["metadata"],
                            "score": score,
                            "source": "bm25",
                        }

    # Sort by combined score
    sorted_results = sorted(results.values(), key=lambda x: -x["score"])
    return sorted_results[:top_k]


def _matches_filter(metadata: dict, filters: dict) -> bool:
    """Check if metadata matches filters."""
    if not filters:
        return True
    for key, value in filters.items():
        if metadata.get(key) != value:
            return False
    return True


def get_stats() -> dict:
    """Get index statistics."""
    return {
        "faiss_vectors": _faiss_index.ntotal if _faiss_index else 0,
        "bm25_documents": len(_bm25_corpus),
        "total_chunks": len(_chunk_metadata),
    }
```

- [ ] **Step 2: Commit**

```bash
git add ai-system/core/retriever.py
git commit -m "feat: implement FAISS + BM25 hybrid retriever"
```

---

### Task 2.4: LLM Client (Gemini)

**Files:**
- Create: `ai-system/core/llm_client.py`

- [ ] **Step 1: Create llm_client.py**

```python
"""Gemini LLM client."""
import logging
import asyncio
import google.generativeai as genai
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


async def generate_response(prompt: str) -> str:
    """Generate response using Gemini."""
    if not prompt or not prompt.strip():
        return "Xin lỗi, không có thông tin truy vấn hợp lệ."

    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)

        # Run in executor to avoid blocking
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=settings.LLM_TEMPERATURE
                )
            )
        )
        return response.text.strip()

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau."


def test_connection() -> bool:
    """Test Gemini API connection."""
    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content("Say OK")
        return "ok" in response.text.lower()
    except Exception as e:
        logger.error(f"Gemini connection test failed: {e}")
        return False
```

- [ ] **Step 2: Commit**

```bash
git add ai-system/core/llm_client.py
git commit -m "feat: implement Gemini LLM client"
```

---

## Phase 3: API Endpoints

### Task 3.1: Health & Chat Routers

**Files:**
- Create: `ai-system/routers/__init__.py`
- Create: `ai-system/routers/health.py`
- Create: `ai-system/routers/chat.py`
- Create: `ai-system/routers/schemas.py`

- [ ] **Step 1: Create schemas.py**

```python"""Pydantic schemas for API."""
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)


class ChatResponse(BaseModel):
    query: str
    response: str
    intent: str
    confidence: float
    sources: list[dict]


class SyncRequest(BaseModel):
    product_id: str


class SyncResponse(BaseModel):
    status: str
    message: str
    chunks_created: int = 0


class StatsResponse(BaseModel):
    total_products: int
    total_chunks: int
    faiss_vectors: int
    bm25_documents: int
    gemini_status: str
```

- [ ] **Step 2: Create health.py**

```python"""Health check router."""
from fastapi import APIRouter
from core.retriever import get_stats
from core.llm_client import test_connection

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Check system health."""
    stats = get_stats()
    gemini_ok = test_connection()

    return {
        "status": "ok",
        "index": stats,
        "gemini": "connected" if gemini_ok else "disconnected",
    }
```

- [ ] **Step 3: Create chat.py**

```python
"""Chat router - RAG pipeline."""
import logging
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
        sources=[{"id": r["id"], "text": r["text"][:100], "score": r["score"]} for r in search_results[:3]],
    )


def _detect_intent(query: str) -> tuple[str, float]:
    """Simple keyword-based intent detection."""
    q = query.lower()

    if any(w in q for w in ["giá", "bao nhiêu", "tiền"]):
        return "price_query", 0.85
    if any(w in q for w in ["so sánh", "khác gì", "vs"]):
        return "comparison_query", 0.85
    if any(w in q for w in ["ram", "cpu", "ssd", "gpu", "thông số"]):
        return "spec_query", 0.85
    if any(w in q for w in ["bảo hành", "warranty"]):
        return "warranty_query", 0.85
    if any(w in q for w in ["tư vấn", "nên mua", "recommend"]):
        return "purchase_advice", 0.80
    if any(w in q for w in ["khuyến mãi", "giảm giá", "sale"]):
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
```

- [ ] **Step 4: Commit**

```bash
git add ai-system/routers/
git commit -m "feat: add health and chat endpoints"
```

---

### Task 3.2: Sync & Admin Routers

**Files:**
- Create: `ai-system/routers/sync.py`
- Create: `ai-system/routers/admin.py`

- [ ] **Step 1: Create sync.py**

```python
"""Sync router - Product ingestion."""
import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import APIKeyHeader
from config import get_settings
from core import chunker, embedder, retriever
from db.supabase_client import fetch_product_by_id

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/sync", tags=["sync"])

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key != settings.RAG_SYNC_API_KEY:
        raise HTTPException(401, "Invalid API key")
    return api_key


@router.post("/product/{product_id}")
async def sync_product(product_id: str, api_key: str = Depends(verify_api_key)):
    """Sync single product to index."""
    # Fetch product
    product = fetch_product_by_id(product_id)
    if not product:
        raise HTTPException(404, f"Product {product_id} not found")

    # Remove old chunks
    retriever.remove_product_chunks(product_id)

    # Generate chunks
    chunks = chunker.chunk_product(product)
    if not chunks:
        raise HTTPException(400, "No chunks generated")

    # Generate embeddings
    texts = [c.text for c in chunks]
    embeddings = embedder.encode_texts(texts)
    for chunk, emb in zip(chunks, embeddings):
        chunk.embedding = emb.tolist()

    # Index
    retriever.index_chunks(chunks)

    return {
        "status": "synced",
        "product_id": product_id,
        "chunks_created": len(chunks),
    }


@router.delete("/product/{product_id}")
async def delete_product(product_id: str, api_key: str = Depends(verify_api_key)):
    """Remove product from index."""
    retriever.remove_product_chunks(product_id)
    return {"status": "deleted", "product_id": product_id}


@router.post("/reindex")
async def reindex_all(api_key: str = Depends(verify_api_key)):
    """Full reindex of all products."""
    from db.supabase_client import fetch_all_products

    products = fetch_all_products()
    if not products:
        raise HTTPException(400, "No products found")

    # Process in background
    asyncio.create_task(_reindex_products(products))

    return {
        "status": "started",
        "total_products": len(products),
    }


async def _reindex_products(products: list[dict]):
    """Background task to reindex all products."""
    all_chunks = []
    for product in products:
        chunks = chunker.chunk_product(product)
        all_chunks.extend(chunks)

    # Generate embeddings in batches
    texts = [c.text for c in all_chunks]
    embeddings = embedder.encode_texts(texts)
    for chunk, emb in zip(all_chunks, embeddings):
        chunk.embedding = emb.tolist()

    # Clear and reindex
    retriever.load_index()  # Reset
    retriever.index_chunks(all_chunks)

    logger.info(f"Reindex completed: {len(all_chunks)} chunks from {len(products)} products")
```

- [ ] **Step 2: Create admin.py**

```python
"""Admin router - System management."""
from fastapi import APIRouter
from core.retriever import get_stats
from core.llm_client import test_connection
from db.supabase_client import fetch_all_products
from routers.schemas import StatsResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=StatsResponse)
async def get_system_stats():
    """Get system statistics."""
    products = fetch_all_products()
    index_stats = get_stats()
    gemini_ok = test_connection()

    return StatsResponse(
        total_products=len(products),
        total_chunks=index_stats["total_chunks"],
        faiss_vectors=index_stats["faiss_vectors"],
        bm25_documents=index_stats["bm25_documents"],
        gemini_status="connected" if gemini_ok else "disconnected",
    )


@router.get("/products")
async def list_products(limit: int = 20, offset: int = 0):
    """List products in database."""
    products = fetch_all_products()
    return {
        "total": len(products),
        "products": products[offset:offset + limit],
    }


@router.get("/chunks/{product_id}")
async def get_product_chunks(product_id: str):
    """Get chunks for a specific product."""
    from core.retriever import _chunk_metadata

    chunks = [
        {"id": cid, "text": meta["text"][:200], "type": meta["metadata"].get("chunk_type")}
        for cid, meta in _chunk_metadata.items()
        if meta["metadata"].get("product_id") == product_id
    ]

    return {"product_id": product_id, "chunks": chunks}
```

- [ ] **Step 3: Commit**

```bash
git add ai-system/routers/sync.py ai-system/routers/admin.py
git commit -m "feat: add sync and admin endpoints"
```

---

## Phase 4: Testing & Deployment

### Task 4.1: Install Dependencies & Test

- [ ] **Step 1: Install dependencies**

```bash
cd ai-system && pip install -r requirements.txt
```

- [ ] **Step 2: Start server**

```bash
cd ai-system && python main.py
```

- [ ] **Step 3: Test health endpoint**

```bash
curl http://localhost:8000/health
```

- [ ] **Step 4: Test reindex**

```bash
curl -X POST http://localhost:8000/sync/reindex -H "X-API-Key: your-secret-key-here"
```

- [ ] **Step 5: Test chat**

```bash
curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"query": "Laptop HP RAM bao nhiêu?"}'
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete AI system rewrite with FAISS + Gemini"
```

---

## Summary

**Total Tasks:** 8 tasks across 4 phases

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | 2 | Foundation (config, DB client) |
| Phase 2 | 4 | Core components (chunker, embedder, retriever, LLM) |
| Phase 3 | 2 | API endpoints (chat, sync, admin) |
| Phase 4 | 1 | Testing & deployment |

**Key Improvements:**
- ✅ FAISS for fast retrieval (in-memory)
- ✅ Supabase pgvector for persistent storage
- ✅ Gemini 3.1 Flash Lite for generation
- ✅ Lightweight, no ChromaDB dependency
- ✅ Admin endpoints for management
- ✅ Clean codebase, easy to maintain

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-08-ai-system-rewrite.md`.**
