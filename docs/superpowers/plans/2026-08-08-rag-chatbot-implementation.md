# RAG Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready RAG chatbot system with real-time product sync from Java backend to Python AI system.

**Architecture:** Monolithic Python FastAPI server with async background tasks. Java backend calls Python API via HTTP for product sync. Hybrid retrieval combining ChromaDB (dense) and BM25 (sparse) with RRF fusion.

**Tech Stack:** Python 3.11+, FastAPI, ChromaDB, BGE-M3, PhoBERT, Google Gemini, Spring Boot, PostgreSQL (Supabase)

## Global Constraints

- Python 3.11+ required
- All API keys stored in `.env` file, never hardcoded
- Async operations use `asyncio.create_task()` for background processing
- All database operations use async SQLAlchemy where possible
- Chunk ID format: `{product_id}_{chunk_type}_{index}`
- Intent labels from `config/constants.py`: `ask_specs`, `compare_products`, `ask_price`, `ask_warranty`, `purchase_consulation`, `ask_promotion`, `order_product`, `complain`, `general_query`, `out_of_scope`
- RRF constant k=60, retrieval top_k=20, rerank top_k=5
- LLM temperature=0.2, max_output_tokens=1024

---

## Phase 1: Core Foundation

### Task 1.1: Environment Configuration

**Files:**
- Create: `ai-system/.env.example`
- Modify: `ai-system/config/settings.py`

**Interfaces:**
- Consumes: None
- Produces: `Settings` class with all configuration fields

- [ ] **Step 1: Create .env.example file**

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres.zzukpubwbntihzztilqy:your-db-password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.zzukpubwbntihzztilqy
DB_PASSWORD=your-db-password

# Vector DB
CHROMA_PERSIST_DIR=./chroma_data
CHROMA_COLLECTION_NAME=products

# BM25
BM25_INDEX_DIR=./bm25_data

# Embedding
EMBEDDING_MODEL_NAME=BAAI/bge-m3
EMBEDDING_BATCH_SIZE=16
EMBEDDING_DEVICE=cpu

# Chunking
MAX_CHUNK_TOKENS=400

# Reranker
RERANKER_MODEL_NAME=BAAI/bge-reranker-v2-m3
RERANKER_DEVICE=cpu
RRF_K=60
RETRIEVAL_TOP_K=20
RERANK_TOP_K=5

# LLM
LLM_PROVIDER=google
LLM_MODEL_NAME=gemini-1.5-flash
LLM_API_KEY=your-gemini-api-key
LLM_TEMPERATURE=0.2

# Security
RAG_SYNC_API_KEY=your-secret-key-here

# App
APP_ENV=development
LOG_LEVEL=INFO
```

- [ ] **Step 2: Update settings.py to add RAG_SYNC_API_KEY**

Add to `Settings` class in `ai-system/config/settings.py`:

```python
# Security
RAG_SYNC_API_KEY: str = os.getenv("RAG_SYNC_API_KEY", "default-dev-key")
```

- [ ] **Step 3: Copy .env.example to .env (if not exists)**

Run: `cp ai-system/.env.example ai-system/.env`

- [ ] **Step 4: Commit**

```bash
git add ai-system/.env.example ai-system/config/settings.py
git commit -m "feat: add environment configuration for RAG system"
```

---

### Task 1.2: API Key Authentication Middleware

**Files:**
- Create: `ai-system/api/middleware.py`
- Modify: `ai-system/api/main.py`

**Interfaces:**
- Consumes: `Settings.RAG_SYNC_API_KEY`
- Produces: `verify_api_key()` dependency for FastAPI routes

- [ ] **Step 1: Write the failing test**

Create `ai-system/tests/test_middleware.py`:

```python
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from api.middleware import verify_api_key


app = FastAPI()


@app.get("/protected", dependencies=[Depends(verify_api_key)])
async def protected_route():
    return {"status": "ok"}


client = TestClient(app)


def test_missing_api_key_returns_401():
    response = client.get("/protected")
    assert response.status_code == 401
    assert "API key missing" in response.json()["detail"]


def test_invalid_api_key_returns_401():
    response = client.get("/protected", headers={"X-API-Key": "wrong-key"})
    assert response.status_code == 401
    assert "Invalid API key" in response.json()["detail"]


def test_valid_api_key_returns_200(monkeypatch):
    monkeypatch.setenv("RAG_SYNC_API_KEY", "test-secret-key")
    response = client.get("/protected", headers={"X-API-Key": "test-secret-key"})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-system && python -m pytest tests/test_middleware.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'api.middleware'"

- [ ] **Step 3: Write minimal implementation**

Create `ai-system/api/middleware.py`:

```python
"""
API Key Authentication Middleware for sync endpoints.
"""
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

from config.settings import get_settings

settings = get_settings()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Verify X-API-Key header against configured RAG_SYNC_API_KEY.

    Raises:
        HTTPException 401: If API key is missing or invalid

    Returns:
        str: The verified API key
    """
    if api_key is None:
        raise HTTPException(
            status_code=401,
            detail="API key missing. Please provide X-API-Key header."
        )
    if api_key != settings.RAG_SYNC_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key."
        )
    return api_key
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai-system && python -m pytest tests/test_middleware.py -v`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add ai-system/api/middleware.py ai-system/tests/test_middleware.py
git commit -m "feat: add API key authentication middleware"
```

---

### Task 1.3: Product Repository - Fetch by ID

**Files:**
- Modify: `ai-system/db/product_repository.py`

**Interfaces:**
- Consumes: `AsyncSession` from SQLAlchemy
- Produces: `ProductRepository.get_product_by_id(product_id: str) -> dict | None`

- [ ] **Step 1: Write the failing test**

Create `ai-system/tests/test_product_repository.py`:

```python
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock
from db.product_repository import ProductRepository


@pytest.fixture
def mock_session():
    session = AsyncMock()
    return session


@pytest.fixture
def repo(mock_session):
    return ProductRepository(mock_session)


@pytest.mark.asyncio
async def test_get_product_by_id_returns_product(repo, mock_session):
    product_id = str(uuid.uuid4())
    mock_result = MagicMock()
    mock_result.fetchone.return_value = {
        "id": product_id,
        "name": "Test Laptop",
        "brand": "ASUS",
        "category": "Laptop",
        "price": 25000000,
        "description": "A test laptop",
        "specifications": {"CPU": "i7", "RAM": "16GB"},
        "warranty": "24 tháng",
        "is_active": True
    }
    mock_session.execute.return_value = mock_result

    result = await repo.get_product_by_id(product_id)

    assert result is not None
    assert result["name"] == "Test Laptop"
    assert result["brand"] == "ASUS"


@pytest.mark.asyncio
async def test_get_product_by_id_returns_none_when_not_found(repo, mock_session):
    product_id = str(uuid.uuid4())
    mock_result = MagicMock()
    mock_result.fetchone.return_value = None
    mock_session.execute.return_value = mock_result

    result = await repo.get_product_by_id(product_id)

    assert result is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-system && python -m pytest tests/test_product_repository.py -v`
Expected: FAIL with "ProductRepository has no attribute 'get_product_by_id'"

- [ ] **Step 3: Read current product_repository.py**

Read: `ai-system/db/product_repository.py` to understand existing structure

- [ ] **Step 4: Add get_product_by_id method**

Add to `ai-system/db/product_repository.py`:

```python
async def get_product_by_id(self, product_id: str) -> dict | None:
    """
    Fetch a single product by ID with its category and specifications.

    Args:
        product_id: UUID string of the product

    Returns:
        dict with product data or None if not found
    """
    query = """
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
            COALESCE(p.is_active, true) as is_active,
            COALESCE(c.name, 'Laptop') as category,
            COALESCE(v.price, 0) as price,
            COALESCE(v.stock, 20) as stock_quantity,
            v.attributes as specifications
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants v ON v.product_id = p.id
        WHERE p.id = :product_id AND p.is_active IS NOT FALSE
    """

    result = await self.session.execute(
        text(query),
        {"product_id": product_id}
    )
    row = result.fetchone()

    if row is None:
        return None

    # Convert to dict
    product = dict(row)

    # Normalize data types
    product['price'] = float(product['price']) if product['price'] is not None else 0.0
    product['rating'] = float(product['rating']) if product['rating'] is not None else 4.8
    product['reviews_count'] = int(product['reviews_count']) if product['reviews_count'] is not None else 20
    product['sold_quantity'] = int(product['sold_quantity']) if product['sold_quantity'] is not None else 0

    # Parse specifications if string
    if isinstance(product.get('specifications'), str):
        import json
        try:
            product['specifications'] = json.loads(product['specifications'])
        except Exception:
            product['specifications'] = {}
    elif not product.get('specifications'):
        product['specifications'] = {}

    return product
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd ai-system && python -m pytest tests/test_product_repository.py -v`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add ai-system/db/product_repository.py ai-system/tests/test_product_repository.py
git commit -m "feat: add get_product_by_id to ProductRepository"
```

---

### Task 1.4: Task Manager for Background Tasks

**Files:**
- Create: `ai-system/services/task_manager.py`

**Interfaces:**
- Consumes: None
- Produces: `TaskManager` class with `create_task()`, `get_task()`, `update_task()` methods

- [ ] **Step 1: Write the failing test**

Create `ai-system/tests/test_task_manager.py`:

```python
import pytest
from services.task_manager import TaskManager, TaskStatus


@pytest.fixture
def manager():
    return TaskManager()


def test_create_task_returns_task_id(manager):
    task_id = manager.create_task(product_id="test-product-123")
    assert task_id is not None
    assert task_id.startswith("task_")


def test_get_task_returns_task_info(manager):
    task_id = manager.create_task(product_id="test-product-123")
    task = manager.get_task(task_id)

    assert task is not None
    assert task["product_id"] == "test-product-123"
    assert task["status"] == TaskStatus.PENDING


def test_update_task_status(manager):
    task_id = manager.create_task(product_id="test-product-123")
    manager.update_task(task_id, status=TaskStatus.PROCESSING)

    task = manager.get_task(task_id)
    assert task["status"] == TaskStatus.PROCESSING


def test_update_task_completed(manager):
    task_id = manager.create_task(product_id="test-product-123")
    manager.update_task(
        task_id,
        status=TaskStatus.COMPLETED,
        chunks_created=4,
        duration_ms=2340
    )

    task = manager.get_task(task_id)
    assert task["status"] == TaskStatus.COMPLETED
    assert task["chunks_created"] == 4
    assert task["duration_ms"] == 2340


def test_update_task_failed(manager):
    task_id = manager.create_task(product_id="test-product-123")
    manager.update_task(
        task_id,
        status=TaskStatus.FAILED,
        error="Embedding failed"
    )

    task = manager.get_task(task_id)
    assert task["status"] == TaskStatus.FAILED
    assert task["error"] == "Embedding failed"


def test_get_nonexistent_task_returns_none(manager):
    task = manager.get_task("nonexistent-task")
    assert task is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-system && python -m pytest tests/test_task_manager.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'services.task_manager'"

- [ ] **Step 3: Write minimal implementation**

Create `ai-system/services/task_manager.py`:

```python
"""
Task Manager for tracking background ingestion tasks.
"""
import time
import uuid
import threading
from enum import StrEnum
from typing import Any


class TaskStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskManager:
    def __init__(self):
        self._tasks: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_task(self, product_id: str) -> str:
        """
        Create a new background task.

        Args:
            product_id: The product being processed

        Returns:
            str: Task ID (format: task_xxxxx)
        """
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        with self._lock:
            self._tasks[task_id] = {
                "task_id": task_id,
                "product_id": product_id,
                "status": TaskStatus.PENDING,
                "chunks_created": 0,
                "duration_ms": 0,
                "error": None,
                "created_at": time.time(),
            }
        return task_id

    def get_task(self, task_id: str) -> dict[str, Any] | None:
        """
        Get task info by task ID.

        Args:
            task_id: The task ID to look up

        Returns:
            dict with task info or None if not found
        """
        with self._lock:
            return self._tasks.get(task_id)

    def update_task(self, task_id: str, **kwargs) -> None:
        """
        Update task fields.

        Args:
            task_id: The task ID to update
            **kwargs: Fields to update (status, chunks_created, duration_ms, error)
        """
        with self._lock:
            if task_id not in self._tasks:
                return

            task = self._tasks[task_id]

            if "status" in kwargs:
                task["status"] = kwargs["status"]
            if "chunks_created" in kwargs:
                task["chunks_created"] = kwargs["chunks_created"]
            if "duration_ms" in kwargs:
                task["duration_ms"] = kwargs["duration_ms"]
            if "error" in kwargs:
                task["error"] = kwargs["error"]

            # Calculate duration if completing
            if kwargs.get("status") in (TaskStatus.COMPLETED, TaskStatus.FAILED):
                if task["duration_ms"] == 0:
                    task["duration_ms"] = int((time.time() - task["created_at"]) * 1000)


# Singleton instance
_task_manager = None


def get_task_manager() -> TaskManager:
    global _task_manager
    if _task_manager is None:
        _task_manager = TaskManager()
    return _task_manager
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai-system && python -m pytest tests/test_task_manager.py -v`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add ai-system/services/task_manager.py ai-system/tests/test_task_manager.py
git commit -m "feat: add TaskManager for background task tracking"
```

---

## Phase 2: Ingestion Pipeline

### Task 2.1: Smart Chunk Orchestrator

**Files:**
- Modify: `ai-system/data_pipeline/chunking/chunk_orchestrator.py`

**Interfaces:**
- Consumes: `product: dict` from database
- Produces: `List[Chunk]` with 4 chunk types (spec, description, faq, policy)

- [ ] **Step 1: Write the failing test**

Create `ai-system/tests/test_chunking.py`:

```python
import pytest
from data_pipeline.chunking.chunk_orchestrator import chunk_product
from data_pipeline.chunking.chunk_schema import Chunk


@pytest.fixture
def sample_product():
    return {
        "id": "test-uuid-123",
        "name": "Laptop ASUS ROG Strix G16",
        "brand": "ASUS",
        "category": "Laptop Gaming",
        "price": 42990000,
        "description": "Laptop gaming cao cấp với thiết kế hầm hố, hiệu năng mạnh mẽ.",
        "specifications": {
            "CPU": "Intel Core i9-14900HX",
            "RAM": "32GB DDR5",
            "GPU": "NVIDIA RTX 4070",
            "Storage": "1TB SSD NVMe",
            "Display": "16 inch QHD 240Hz"
        },
        "warranty": "24 tháng chính hãng ASUS",
        "faqs": [
            {
                "question": "Laptop này chơi được game AAA không?",
                "answer": "Có, với RTX 4070 chiến mượt mọi game AAA."
            }
        ]
    }


def test_chunk_product_returns_four_types(sample_product):
    chunks = chunk_product(sample_product)

    chunk_types = {c.chunk_type for c in chunks}
    assert "spec" in chunk_types
    assert "description" in chunk_types
    assert "faq" in chunk_types
    assert "policy" in chunk_types


def test_chunk_ids_follow_format(sample_product):
    chunks = chunk_product(sample_product)

    for chunk in chunks:
        assert chunk.id.startswith("test-uuid-123_")
        assert "_" in chunk.id


def test_spec_chunk_contains_all_specs(sample_product):
    chunks = chunk_product(sample_product)
    spec_chunk = next(c for c in chunks if c.chunk_type == "spec")

    assert "CPU" in spec_chunk.text
    assert "Intel Core i9-14900HX" in spec_chunk.text
    assert "RAM" in spec_chunk.text
    assert "32GB DDR5" in spec_chunk.text
    assert "42.990.000" in spec_chunk.text


def test_description_chunk_contains_description(sample_product):
    chunks = chunk_product(sample_product)
    desc_chunk = next(c for c in chunks if c.chunk_type == "description")

    assert "Laptop gaming cao cấp" in desc_chunk.text
    assert "ASUS ROG Strix G16" in desc_chunk.text


def test_faq_chunk_contains_questions(sample_product):
    chunks = chunk_product(sample_product)
    faq_chunk = next(c for c in chunks if c.chunk_type == "faq")

    assert "game AAA" in faq_chunk.text
    assert "RTX 4070" in faq_chunk.text


def test_policy_chunk_contains_warranty(sample_product):
    chunks = chunk_product(sample_product)
    policy_chunk = next(c for c in chunks if c.chunk_type == "policy")

    assert "24 tháng" in policy_chunk.text
    assert "ASUS" in policy_chunk.text


def test_chunks_have_metadata(sample_product):
    chunks = chunk_product(sample_product)

    for chunk in chunks:
        assert chunk.metadata.get("product_name") == "Laptop ASUS ROG Strix G16"
        assert chunk.metadata.get("brand") == "ASUS"
        assert chunk.metadata.get("category") == "Laptop Gaming"
        assert chunk.metadata.get("price") == 42990000


def test_empty_product_returns_empty_list():
    chunks = chunk_product({})
    assert chunks == []
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-system && python -m pytest tests/test_chunking.py -v`
Expected: FAIL (existing implementation only creates 2 chunks, not 4)

- [ ] **Step 3: Rewrite chunk_orchestrator.py**

Replace `ai-system/data_pipeline/chunking/chunk_orchestrator.py`:

```python
"""
Chunk Orchestrator: Điều phối chunking dữ liệu sản phẩm thành các Chunk.
Hỗ trợ 4 loại chunk: spec, description, faq, policy
"""
from typing import List
from data_pipeline.chunking.chunk_schema import Chunk


def _format_price(price: int | float) -> str:
    """Format price to Vietnamese format: 42.990.000₫"""
    try:
        price_int = int(price)
        # Format with dots as thousand separators
        formatted = f"{price_int:,}".replace(",", ".")
        return f"{formatted}₫"
    except (ValueError, TypeError):
        return "Liên hệ"


def _build_spec_text(product: dict) -> str:
    """Build specification chunk text."""
    name = product.get("name", "")
    brand = product.get("brand", "")
    specs = product.get("specifications", {})
    price = product.get("price", 0)

    parts = [f"{brand} {name}"]

    if specs:
        spec_parts = [f"{k}: {v}" for k, v in specs.items()]
        parts.append(" | ".join(spec_parts))

    if price:
        parts.append(f"Giá: {_format_price(price)}")

    return " | ".join(parts)


def _build_description_text(product: dict) -> str:
    """Build description chunk text."""
    name = product.get("name", "")
    brand = product.get("brand", "")
    description = product.get("description", "")
    category = product.get("category", "")
    use_case = product.get("use_case", "")

    parts = [f"{brand} {name}"]

    if category:
        parts.append(f"Danh mục: {category}")
    if use_case:
        parts.append(f"Phù hợp cho: {use_case}")
    if description:
        parts.append(description)

    return ". ".join(parts)


def _build_faq_text(product: dict) -> str:
    """Build FAQ chunk text."""
    name = product.get("name", "")
    faqs = product.get("faqs", [])

    if not faqs:
        # Generate default FAQ from product info
        return f"Sản phẩm {name} - Vui lòng liên hệ để được tư vấn chi tiết."

    parts = [f"Câu hỏi thường gặp về {name}:"]
    for faq in faqs:
        q = faq.get("question", "")
        a = faq.get("answer", "")
        if q and a:
            parts.append(f"Q: {q}")
            parts.append(f"A: {a}")

    return "\n".join(parts)


def _build_policy_text(product: dict) -> str:
    """Build policy chunk text."""
    name = product.get("name", "")
    brand = product.get("brand", "")
    warranty = product.get("warranty", "")
    promotions = product.get("promotions", "")

    parts = [f"Chính sách sản phẩm {brand} {name}:"]

    if warranty:
        parts.append(f"Bảo hành: {warranty}")
    else:
        parts.append("Bảo hành: Theo chính sách nhà sản xuất")

    if promotions:
        parts.append(f"Khuyến mãi: {promotions}")

    parts.append("Đổi trả: Trong 7 ngày nếu lỗi nhà sản xuất")
    parts.append("Vận chuyển: Miễn phí toàn quốc")

    return "\n".join(parts)


def chunk_product(product: dict) -> List[Chunk]:
    """
    Phân tách sản phẩm thành danh sách Chunk.

    Args:
        product: dict containing product data from database

    Returns:
        List[Chunk]: 4 chunks (spec, description, faq, policy)
    """
    product_id = str(product.get("id", ""))

    if not product_id or not product.get("name"):
        return []

    chunks: List[Chunk] = []

    # Common metadata for all chunks
    base_metadata = {
        "product_name": product.get("name", ""),
        "brand": product.get("brand", ""),
        "category": product.get("category", ""),
        "price": product.get("price", 0),
    }

    # 1. Spec Chunk (Thông số kỹ thuật)
    spec_text = _build_spec_text(product)
    chunks.append(
        Chunk(
            id=f"{product_id}_spec_0",
            text=spec_text,
            product_id=product_id,
            chunk_type="spec",
            metadata={**base_metadata, "chunk_type": "spec"},
        )
    )

    # 2. Description Chunk (Mô tả sản phẩm)
    desc_text = _build_description_text(product)
    chunks.append(
        Chunk(
            id=f"{product_id}_description_0",
            text=desc_text,
            product_id=product_id,
            chunk_type="description",
            metadata={**base_metadata, "chunk_type": "description"},
        )
    )

    # 3. FAQ Chunk (Câu hỏi thường gặp)
    faq_text = _build_faq_text(product)
    chunks.append(
        Chunk(
            id=f"{product_id}_faq_0",
            text=faq_text,
            product_id=product_id,
            chunk_type="faq",
            metadata={**base_metadata, "chunk_type": "faq"},
        )
    )

    # 4. Policy Chunk (Chính sách)
    policy_text = _build_policy_text(product)
    chunks.append(
        Chunk(
            id=f"{product_id}_policy_0",
            text=policy_text,
            product_id=product_id,
            chunk_type="policy",
            metadata={**base_metadata, "chunk_type": "policy"},
        )
    )

    return chunks
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai-system && python -m pytest tests/test_chunking.py -v`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add ai-system/data_pipeline/chunking/chunk_orchestrator.py ai-system/tests/test_chunking.py
git commit -m "feat: implement smart chunking with 4 chunk types"
```

---

### Task 2.2: Ingestion Service

**Files:**
- Create: `ai-system/services/ingestion_service.py`

**Interfaces:**
- Consumes: `ProductRepository.get_product_by_id()`, `chunk_product()`, `bge_m3_encoder`, `hybrid_indexer`
- Produces: `IngestionService.ingest_product(product_id: str, task_id: str)`

- [ ] **Step 1: Write the failing test**

Create `ai-system/tests/test_ingestion_service.py`:

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from services.ingestion_service import IngestionService
from services.task_manager import TaskStatus


@pytest.fixture
def mock_dependencies():
    return {
        "repo": AsyncMock(),
        "task_manager": MagicMock(),
        "encoder": MagicMock(),
        "indexer": MagicMock(),
    }


@pytest.mark.asyncio
async def test_ingest_product_success(mock_dependencies):
    service = IngestionService(**mock_dependencies)

    # Mock product data
    mock_dependencies["repo"].get_product_by_id.return_value = {
        "id": "test-123",
        "name": "Test Laptop",
        "brand": "ASUS",
        "price": 25000000,
        "description": "A test laptop",
        "specifications": {"CPU": "i7"},
        "warranty": "24 tháng"
    }

    # Mock encoder
    mock_dependencies["encoder"].encode_documents.return_value = [[0.1] * 1024] * 4

    # Run ingestion
    await service.ingest_product("test-123", "task-abc")

    # Verify task was updated
    mock_dependencies["task_manager"].update_task.assert_any_call(
        "task-abc", status=TaskStatus.PROCESSING
    )
    mock_dependencies["task_manager"].update_task.assert_any_call(
        "task-abc", status=TaskStatus.COMPLETED, chunks_created=4
    )


@pytest.mark.asyncio
async def test_ingest_product_handles_missing_product(mock_dependencies):
    service = IngestionService(**mock_dependencies)

    # Mock product not found
    mock_dependencies["repo"].get_product_by_id.return_value = None

    # Run ingestion
    await service.ingest_product("nonexistent", "task-abc")

    # Verify task was marked as failed
    mock_dependencies["task_manager"].update_task.assert_any_call(
        "task-abc", status=TaskStatus.FAILED, error="Product nonexistent not found"
    )
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-system && python -m pytest tests/test_ingestion_service.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'services.ingestion_service'"

- [ ] **Step 3: Write minimal implementation**

Create `ai-system/services/ingestion_service.py`:

```python
"""
Ingestion Service: Orchestrates the product ingestion pipeline.
Fetch → Chunk → Embed → Index
"""
import logging
import time

from db.product_repository import ProductRepository
from data_pipeline.chunking.chunk_orchestrator import chunk_product
from embedding import bge_m3_encoder
from indexing import hybrid_indexer
from services.task_manager import TaskManager, TaskStatus

logger = logging.getLogger(__name__)


class IngestionService:
    def __init__(
        self,
        repo: ProductRepository,
        task_manager: TaskManager,
        encoder=None,
        indexer=None,
    ):
        self.repo = repo
        self.task_manager = task_manager
        self.encoder = encoder or bge_m3_encoder
        self.indexer = indexer or hybrid_indexer

    async def ingest_product(self, product_id: str, task_id: str) -> None:
        """
        Run the full ingestion pipeline for a single product.

        Args:
            product_id: UUID of the product to ingest
            task_id: Task ID for tracking progress
        """
        start_time = time.time()

        try:
            # Update task status to processing
            self.task_manager.update_task(task_id, status=TaskStatus.PROCESSING)

            # Step 1: Fetch product from database
            product = await self.repo.get_product_by_id(product_id)
            if product is None:
                raise ValueError(f"Product {product_id} not found")

            # Step 2: Generate chunks
            chunks = chunk_product(product)
            if not chunks:
                raise ValueError(f"No chunks generated for product {product_id}")

            # Step 3: Generate embeddings
            texts = [c.text for c in chunks]
            embeddings = self.encoder.encode_documents(texts)

            # Assign embeddings to chunks
            for chunk, embedding in zip(chunks, embeddings):
                chunk.embedding = embedding

            # Step 4: Remove old chunks and index new ones
            self.indexer.remove_product_chunks(product_id)
            self.indexer.index_chunks(chunks)

            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)

            # Update task as completed
            self.task_manager.update_task(
                task_id,
                status=TaskStatus.COMPLETED,
                chunks_created=len(chunks),
                duration_ms=duration_ms,
            )

            logger.info(
                f"Ingestion completed for product {product_id}: "
                f"{len(chunks)} chunks in {duration_ms}ms"
            )

        except Exception as e:
            duration_ms = int((time.time() - start_time) * 1000)
            logger.error(f"Ingestion failed for product {product_id}: {e}")

            # Update task as failed
            self.task_manager.update_task(
                task_id,
                status=TaskStatus.FAILED,
                error=str(e),
                duration_ms=duration_ms,
            )


# Singleton instance
_ingestion_service = None


def get_ingestion_service() -> IngestionService:
    global _ingestion_service
    if _ingestion_service is None:
        from services.task_manager import get_task_manager
        from db.database import AsyncSessionLocal

        # Note: This creates a new session for each call
        # In production, use dependency injection
        _ingestion_service = IngestionService(
            repo=ProductRepository(None),  # Will be set per request
            task_manager=get_task_manager(),
        )
    return _ingestion_service
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai-system && python -m pytest tests/test_ingestion_service.py -v`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add ai-system/services/ingestion_service.py ai-system/tests/test_ingestion_service.py
git commit -m "feat: implement IngestionService for product sync pipeline"
```

---

### Task 2.3: Sync API Endpoints

**Files:**
- Create: `ai-system/api/routers/sync.py`
- Modify: `ai-system/api/main.py`

**Interfaces:**
- Consumes: `verify_api_key`, `IngestionService`, `TaskManager`
- Produces: `POST /sync/product/{id}`, `DELETE /sync/product/{id}`, `GET /sync/status/{task_id}`

- [ ] **Step 1: Write the failing test**

Create `ai-system/tests/test_sync_api.py`:

```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from api.main import app


client = TestClient(app)


@pytest.fixture
def mock_services():
    with patch("api.routers.sync.get_task_manager") as mock_tm, \
         patch("api.routers.sync.get_ingestion_service") as mock_is, \
         patch("api.routers.sync.verify_api_key") as mock_auth:

        mock_auth.return_value = "test-key"

        task_manager = MagicMock()
        task_manager.create_task.return_value = "task-test-123"
        task_manager.get_task.return_value = {
            "task_id": "task-test-123",
            "product_id": "prod-123",
            "status": "completed",
            "chunks_created": 4,
            "duration_ms": 2340,
            "error": None,
        }
        mock_tm.return_value = task_manager

        ingestion_service = MagicMock()
        mock_is.return_value = ingestion_service

        yield {
            "task_manager": task_manager,
            "ingestion_service": ingestion_service,
        }


def test_sync_product_returns_202(mock_services):
    response = client.post(
        "/sync/product/prod-123",
        headers={"X-API-Key": "test-key"}
    )

    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "accepted"
    assert data["task_id"] == "task-test-123"


def test_sync_product_without_api_key_returns_401():
    response = client.post("/sync/product/prod-123")
    assert response.status_code == 401


def test_delete_product_returns_200(mock_services):
    mock_services["task_manager"].get_task.return_value = None

    # Mock the indexer
    with patch("api.routers.sync.hybrid_indexer") as mock_indexer:
        mock_indexer.remove_product_chunks.return_value = None

        response = client.delete(
            "/sync/product/prod-123",
            headers={"X-API-Key": "test-key"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"


def test_get_task_status_returns_200(mock_services):
    response = client.get("/sync/status/task-test-123")

    assert response.status_code == 200
    data = response.json()
    assert data["task_id"] == "task-test-123"
    assert data["status"] == "completed"
    assert data["chunks_created"] == 4


def test_get_task_status_not_found():
    with patch("api.routers.sync.get_task_manager") as mock_tm:
        mock_tm.return_value.get_task.return_value = None

        response = client.get("/sync/status/nonexistent")

        assert response.status_code == 404
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-system && python -m pytest tests/test_sync_api.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'api.routers.sync'"

- [ ] **Step 3: Write minimal implementation**

Create `ai-system/api/routers/sync.py`:

```python
"""
Sync API Router: Endpoints for Java backend to trigger product sync.
"""
import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException

from api.middleware import verify_api_key
from services.task_manager import get_task_manager, TaskStatus
from services.ingestion_service import IngestionService
from db.product_repository import ProductRepository
from db.database import AsyncSessionLocal
from indexing import hybrid_indexer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/product/{product_id}", status_code=202)
async def sync_product(
    product_id: str,
    api_key: str = Depends(verify_api_key),
):
    """
    Trigger product ingestion (async).

    Returns 202 Accepted immediately while processing in background.
    """
    task_manager = get_task_manager()

    # Create task for tracking
    task_id = task_manager.create_task(product_id=product_id)

    # Start background ingestion
    asyncio.create_task(_run_ingestion(product_id, task_id))

    return {
        "status": "accepted",
        "task_id": task_id,
        "message": "Product ingestion started",
    }


@router.delete("/product/{product_id}")
async def delete_product(
    product_id: str,
    api_key: str = Depends(verify_api_key),
):
    """
    Delete product from all indexes (ChromaDB + BM25).
    """
    try:
        # Remove from both indexes
        hybrid_indexer.remove_product_chunks(product_id)

        return {
            "status": "deleted",
            "message": "Product removed from index",
        }
    except Exception as e:
        logger.error(f"Failed to delete product {product_id} from index: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Get ingestion task status.
    """
    task_manager = get_task_manager()
    task = task_manager.get_task(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


async def _run_ingestion(product_id: str, task_id: str):
    """Run ingestion in background."""
    try:
        async with AsyncSessionLocal() as session:
            repo = ProductRepository(session)
            ingestion_service = IngestionService(
                repo=repo,
                task_manager=get_task_manager(),
            )
            await ingestion_service.ingest_product(product_id, task_id)
    except Exception as e:
        logger.error(f"Background ingestion failed: {e}")
        get_task_manager().update_task(
            task_id,
            status=TaskStatus.FAILED,
            error=str(e),
        )
```

- [ ] **Step 4: Update main.py to include sync router**

Add to `ai-system/api/main.py` after existing router includes:

```python
from api.routers import admin_products, chat, stage_testing, sync

# ... existing code ...

app.include_router(sync.router)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd ai-system && python -m pytest tests/test_sync_api.py -v`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add ai-system/api/routers/sync.py ai-system/api/main.py ai-system/tests/test_sync_api.py
git commit -m "feat: add sync API endpoints for product ingestion"
```

---

## Phase 3: Java Backend Integration

### Task 3.1: Java SyncService

**Files:**
- Create: `backend/src/main/java/ptithcm/tttnd35backend/service/ISyncService.java`
- Create: `backend/src/main/java/ptithcm/tttnd35backend/service/impl/SyncService.java`

**Interfaces:**
- Consumes: `RestTemplate`, RAG API configuration
- Produces: `syncProductToRAG(UUID)`, `deleteProductFromRAG(UUID)`

- [ ] **Step 1: Create ISyncService interface**

Create `backend/src/main/java/ptithcm/tttnd35backend/service/ISyncService.java`:

```java
package ptithcm.tttnd35backend.service;

import java.util.UUID;

public interface ISyncService {
    void syncProductToRAG(UUID productId);
    void deleteProductFromRAG(UUID productId);
}
```

- [ ] **Step 2: Create SyncService implementation**

Create `backend/src/main/java/ptithcm/tttnd35backend/service/impl/SyncService.java`:

```java
package ptithcm.tttnd35backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import ptithcm.tttnd35backend.service.ISyncService;

import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SyncService implements ISyncService {

    @Value("${rag.api.url}")
    private String ragApiUrl;

    @Value("${rag.api.key}")
    private String ragApiKey;

    private final RestTemplate restTemplate;

    @Override
    @Async
    public void syncProductToRAG(UUID productId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", ragApiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<?> entity = new HttpEntity<>(headers);
            String url = ragApiUrl + "/sync/product/" + productId;

            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, Map.class
            );

            log.info("RAG sync started for product {}: {}", productId, response.getBody());
        } catch (Exception e) {
            log.error("RAG sync failed for product {}: {}", productId, e.getMessage());
            // Don't throw - sync failure shouldn't block admin CRUD
        }
    }

    @Override
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
            // Don't throw - delete failure shouldn't block admin CRUD
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/ptithcm/tttnd35backend/service/ISyncService.java
git add backend/src/main/java/ptithcm/tttnd35backend/service/impl/SyncService.java
git commit -m "feat: add Java SyncService for RAG integration"
```

---

### Task 3.2: Java Configuration

**Files:**
- Modify: `backend/src/main/java/ptithcm/tttnd35backend/config/RestClientConfig.java`
- Modify: `backend/src/main/resources/application.yml`

**Interfaces:**
- Consumes: None
- Produces: `RestTemplate` bean, RAG configuration properties

- [ ] **Step 1: Update RestClientConfig.java**

Modify `backend/src/main/java/ptithcm/tttnd35backend/config/RestClientConfig.java`:

```java
package ptithcm.tttnd35backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

- [ ] **Step 2: Update application.yml**

Add to `backend/src/main/resources/application.yml`:

```yaml
# RAG Chatbot Integration
rag:
  api:
    url: http://localhost:8000
    key: your-secret-key-here

# Async Configuration
spring:
  task:
    execution:
      pool:
        core-size: 2
        max-size: 5
        queue-capacity: 100
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/main/java/ptithcm/tttnd35backend/config/RestClientConfig.java
git add backend/src/main/resources/application.yml
git commit -m "feat: add Java configuration for RAG integration"
```

---

### Task 3.3: Integrate SyncService into ProductService

**Files:**
- Modify: `backend/src/main/java/ptithcm/tttnd35backend/service/impl/ProductService.java`

**Interfaces:**
- Consumes: `ISyncService`
- Produces: Auto-sync on product create/update/delete

- [ ] **Step 1: Read current ProductService.java**

Read: `backend/src/main/java/ptithcm/tttnd35backend/service/impl/ProductService.java`

- [ ] **Step 2: Add SyncService dependency**

Add to ProductService class:

```java
private final ISyncService syncService;
```

- [ ] **Step 3: Add sync calls after CRUD operations**

After `create` method:
```java
// Sync to RAG after successful creation
syncService.syncProductToRAG(product.getId());
```

After `update` method:
```java
// Re-sync to RAG after update
syncService.syncProductToRAG(id);
```

After `setActive(false)`:
```java
// Remove from RAG index when deactivating
syncService.deleteProductFromRAG(id);
```

After `setActive(true)`:
```java
// Re-index when reactivating
syncService.syncProductToRAG(id);
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/ptithcm/tttnd35backend/service/impl/ProductService.java
git commit -m "feat: integrate SyncService into ProductService for auto-sync"
```

---

## Phase 4: Query Pipeline Enhancement

### Task 4.1: Enhanced NER Extractor

**Files:**
- Modify: `ai-system/nlu/ner_extractor.py`

**Interfaces:**
- Consumes: `query: str`
- Produces: `List[ExtractedEntity]` with brand, product_name, spec_attribute

- [ ] **Step 1: Write the failing test**

Create `ai-system/tests/test_ner.py`:

```python
import pytest
from nlu.ner_extractor import extract_entities
from config.constants import EntityType


def test_extract_brand():
    entities = extract_entities("Laptop ASUS ROG Strix G16 có RAM bao nhiêu?")
    brands = [e for e in entities if e.entity_type == EntityType.BRAND]
    assert len(brands) > 0
    assert brands[0].text == "ASUS"


def test_extract_spec_attribute():
    entities = extract_entities("Laptop này có RAM bao nhiêu?")
    specs = [e for e in entities if e.entity_type == EntityType.SPEC]
    assert len(specs) > 0
    assert "RAM" in specs[0].text.upper()


def test_extract_multiple_brands():
    entities = extract_entities("So sánh ASUS ROG vs MSI Raider")
    brands = [e for e in entities if e.entity_type == EntityType.BRAND]
    brand_texts = [e.text for e in brands]
    assert "ASUS" in brand_texts
    assert "MSI" in brand_texts


def test_extract_price_range():
    entities = extract_entities("Laptop gaming giá 20-30 triệu")
    prices = [e for e in entities if e.entity_type == EntityType.PRICE]
    assert len(prices) > 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-system && python -m pytest tests/test_ner.py -v`
Expected: FAIL (existing implementation may not extract all entities)

- [ ] **Step 3: Update ner_extractor.py**

Update `ai-system/nlu/ner_extractor.py` with enhanced pattern matching:

```python
"""
NER Extractor: Rule-based entity extraction for Vietnamese electronics domain.
"""
import re
from typing import List
from config.constants import EntityType, ExtractedEntity

# Brand patterns (case-insensitive)
BRAND_PATTERNS = [
    r'\b(ASUS|ACER|DELL|HP|LENOVO|MSI|APPLE|SAMSUNG|XIAOMI|OPPO|VIVO|REALME)\b',
    r'\b(Razer|Microsoft|LG|Sony|JBL|Anker|Logitech)\b',
]

# Spec attribute patterns
SPEC_PATTERNS = [
    (r'\b(RAM|ROM|SSD|HDD|NVMe)\b', 'MEMORY'),
    (r'\b(CPU|GPU|chip|processor|card đồ họa)\b', 'PROCESSOR'),
    (r'\b(màn hình|display|screen|inch|inch)\b', 'DISPLAY'),
    (r'\b(pin|battery|sạc|charger)\b', 'BATTERY'),
    (r'\b(camera|webcam)\b', 'CAMERA'),
    (r'\b(bàn phím|keyboard|chuột|mouse)\b', 'PERIPHERAL'),
]

# Price patterns
PRICE_PATTERNS = [
    r'(\d+[\.,]?\d*)\s*(triệu|tr|k|nghìn)',
    r'giá\s*(\d+[\.,]?\d*)',
    r'(\d+[\.,]?\d*)\s*(VND|đ|₫)',
]


def extract_entities(query: str) -> List[ExtractedEntity]:
    """
    Extract entities from Vietnamese query text.

    Args:
        query: Vietnamese text query

    Returns:
        List of extracted entities
    """
    entities = []
    query_upper = query.upper()

    # Extract brands
    for pattern in BRAND_PATTERNS:
        for match in re.finditer(pattern, query, re.IGNORECASE):
            entities.append(ExtractedEntity(
                text=match.group(1).upper(),
                entity_type=EntityType.BRAND,
                start_char=match.start(),
                end_char=match.end(),
                confidence=0.95,
            ))

    # Extract spec attributes
    for pattern, _ in SPEC_PATTERNS:
        for match in re.finditer(pattern, query, re.IGNORECASE):
            entities.append(ExtractedEntity(
                text=match.group(0).upper(),
                entity_type=EntityType.SPEC,
                start_char=match.start(),
                end_char=match.end(),
                confidence=0.9,
            ))

    # Extract price ranges
    for pattern in PRICE_PATTERNS:
        for match in re.finditer(pattern, query, re.IGNORECASE):
            entities.append(ExtractedEntity(
                text=match.group(0),
                entity_type=EntityType.PRICE,
                start_char=match.start(),
                end_char=match.end(),
                confidence=0.85,
            ))

    # Extract product names (heuristic: words after brand)
    for brand_entity in [e for e in entities if e.entity_type == EntityType.BRAND]:
        # Look for product name after brand
        after_brand = query[brand_entity.end_char:].strip()
        # Match common product name patterns
        name_match = re.match(r'\s+([A-Z0-9][\w\s]+?)(?:\s+(?:có|với|giá|RAM|CPU|SSD)|$)', after_brand, re.IGNORECASE)
        if name_match:
            product_name = name_match.group(1).strip()
            if len(product_name) > 3:  # Minimum length for product name
                entities.append(ExtractedEntity(
                    text=product_name,
                    entity_type=EntityType.PRODUCT_NAME,
                    start_char=brand_entity.end_char + name_match.start(),
                    end_char=brand_entity.end_char + name_match.end(),
                    confidence=0.8,
                ))

    return entities
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai-system && python -m pytest tests/test_ner.py -v`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add ai-system/nlu/ner_extractor.py ai-system/tests/test_ner.py
git commit -m "feat: enhance NER extractor with better pattern matching"
```

---

### Task 4.2: Enhanced Query Builder

**Files:**
- Modify: `ai-system/retrieval/query_builder.py`

**Interfaces:**
- Consumes: `NLUResult` with intent and entities
- Produces: `RetrievalQuery` with search_text, filters, preferred_chunk_types

- [ ] **Step 1: Write the failing test**

Create `ai-system/tests/test_query_builder.py`:

```python
import pytest
from retrieval.query_builder import build_retrieval_query
from nlu.query_processor import NLUResult
from config.constants import EntityType, ExtractedEntity


def test_spec_query_builds_correct_filter():
    nlu_result = NLUResult(
        intent="ask_specs",
        confidence=0.92,
        entities=[
            ExtractedEntity(text="ASUS", entity_type=EntityType.BRAND),
            ExtractedEntity(text="RAM", entity_type=EntityType.SPEC),
        ],
        is_out_of_scope=False,
    )

    query = build_retrieval_query(nlu_result)

    assert query.preferred_chunk_types == ["spec"]
    assert query.filters.get("brand") == "ASUS"
    assert "RAM" in query.search_text


def test_comparison_query_no_filter():
    nlu_result = NLUResult(
        intent="compare_products",
        confidence=0.88,
        entities=[
            ExtractedEntity(text="ASUS", entity_type=EntityType.BRAND),
            ExtractedEntity(text="MSI", entity_type=EntityType.BRAND),
        ],
        is_out_of_scope=False,
    )

    query = build_retrieval_query(nlu_result)

    assert "spec" in query.preferred_chunk_types
    assert "description" in query.preferred_chunk_types
    assert query.filters is None or len(query.filters) == 0


def test_warranty_query_policy_chunks():
    nlu_result = NLUResult(
        intent="ask_warranty",
        confidence=0.85,
        entities=[
            ExtractedEntity(text="ASUS", entity_type=EntityType.BRAND),
        ],
        is_out_of_scope=False,
    )

    query = build_retrieval_query(nlu_result)

    assert "policy" in query.preferred_chunk_types
    assert "faq" in query.preferred_chunk_types


def test_purchase_advice_category_filter():
    nlu_result = NLUResult(
        intent="purchase_consultation",
        confidence=0.9,
        entities=[
            ExtractedEntity(text="Laptop Gaming", entity_type=EntityType.PRODUCT_NAME),
        ],
        is_out_of_scope=False,
    )

    query = build_retrieval_query(nlu_result)

    assert "description" in query.preferred_chunk_types
    assert "spec" in query.preferred_chunk_types
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-system && python -m pytest tests/test_query_builder.py -v`
Expected: FAIL (existing implementation may not map all intents correctly)

- [ ] **Step 3: Update query_builder.py**

Update `ai-system/retrieval/query_builder.py`:

```python
"""
Query Builder: Converts NLU results to RetrievalQuery for hybrid search.
"""
from dataclasses import dataclass, field
from typing import Any

from nlu.query_processor import NLUResult
from config.constants import EntityType


@dataclass
class RetrievalQuery:
    search_text: str
    filters: dict[str, Any] | None = None
    preferred_chunk_types: list[str] = field(default_factory=list)


# Intent → Preferred Chunk Types mapping
INTENT_CHUNK_MAP = {
    "ask_specs": ["spec"],
    "ask_price": ["spec"],
    "compare_products": ["spec", "description"],
    "ask_warranty": ["policy", "faq"],
    "purchase_consultation": ["description", "spec"],
    "ask_promotion": ["spec", "faq"],
    "order_product": ["faq"],
    "complain": ["faq", "policy"],
    "general_query": ["description", "spec"],
    "out_of_scope": [],
}


def build_retrieval_query(nlu_result: NLUResult) -> RetrievalQuery:
    """
    Build RetrievalQuery from NLU analysis result.

    Args:
        nlu_result: NLU analysis with intent and entities

    Returns:
        RetrievalQuery for hybrid search
    """
    # Get preferred chunk types based on intent
    preferred_chunks = INTENT_CHUNK_MAP.get(nlu_result.intent, ["description", "spec"])

    # Build search text from entities
    search_parts = []
    brand = None
    product_name = None
    spec_attrs = []

    for entity in nlu_result.entities:
        if entity.entity_type == EntityType.BRAND:
            brand = entity.text
            search_parts.append(entity.text)
        elif entity.entity_type == EntityType.PRODUCT_NAME:
            product_name = entity.text
            search_parts.append(entity.text)
        elif entity.entity_type == EntityType.SPEC:
            spec_attrs.append(entity.text)
            search_parts.append(entity.text)

    # If no entities found, use original query
    if not search_parts:
        search_text = nlu_result.query if hasattr(nlu_result, 'query') else ""
    else:
        search_text = " ".join(search_parts)

    # Build filters
    filters = {}

    # For comparison queries, don't filter by brand (need both products)
    if nlu_result.intent != "compare_products":
        if brand:
            filters["brand"] = brand

    # For purchase advice, could filter by category
    if nlu_result.intent == "purchase_consultation" and product_name:
        # Try to extract category from product name
        if "gaming" in product_name.lower():
            filters["category"] = "Laptop Gaming"
        elif "văn phòng" in product_name.lower():
            filters["category"] = "Laptop Văn Phòng"

    return RetrievalQuery(
        search_text=search_text,
        filters=filters if filters else None,
        preferred_chunk_types=preferred_chunks,
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai-system && python -m pytest tests/test_query_builder.py -v`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add ai-system/retrieval/query_builder.py ai-system/tests/test_query_builder.py
git commit -m "feat: enhance query builder with intent-to-chunk mapping"
```

---

## Phase 5: Chat Pipeline

### Task 5.1: Chat Service

**Files:**
- Create: `ai-system/services/chat_service.py`

**Interfaces:**
- Consumes: `query_processor`, `query_builder`, `hybrid_retriever`, `reranker`, `prompt_builder`, `llm_client`, `response_validator`
- Produces: `ChatService.process_chat(query: str) -> ChatResponse`

- [ ] **Step 1: Write the failing test**

Create `ai-system/tests/test_chat_service.py`:

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from services.chat_service import ChatService


@pytest.fixture
def mock_dependencies():
    return {
        "nlu_processor": MagicMock(),
        "query_builder": MagicMock(),
        "retriever": MagicMock(),
        "reranker": MagicMock(),
        "prompt_builder": MagicMock(),
        "llm_client": AsyncMock(),
        "validator": MagicMock(),
    }


@pytest.mark.asyncio
async def test_chat_service_returns_response(mock_dependencies):
    service = ChatService(**mock_dependencies)

    # Mock NLU result
    mock_dependencies["nlu_processor"].process_query.return_value = MagicMock(
        intent="ask_specs",
        confidence=0.92,
        entities=[],
        is_out_of_scope=False,
    )

    # Mock retrieval
    mock_dependencies["retriever"].retrieve.return_value = []
    mock_dependencies["reranker"].rerank_documents.return_value = []

    # Mock LLM
    mock_dependencies["llm_client"].generate_response.return_value = "Test response"

    # Mock validation
    mock_dependencies["validator"].validate_response.return_value = MagicMock(
        sanitized_response="Test response",
        is_valid=True,
        faithfulness_score=0.95,
        numerical_consistency=True,
        issues=[],
    )

    result = await service.process_chat("Laptop ASUS RAM bao nhiêu?")

    assert result.response == "Test response"
    assert result.nlu_info.intent == "ask_specs"


@pytest.mark.asyncio
async def test_chat_service_handles_out_of_scope(mock_dependencies):
    service = ChatService(**mock_dependencies)

    # Mock NLU result as out of scope
    mock_dependencies["nlu_processor"].process_query.return_value = MagicMock(
        intent="out_of_scope",
        confidence=0.3,
        entities=[],
        is_out_of_scope=True,
    )

    result = await service.process_chat("Thời tiết hôm nay thế nào?")

    assert "ngoài phạm vi" in result.response.lower() or "xin lỗi" in result.response.lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-system && python -m pytest tests/test_chat_service.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'services.chat_service'"

- [ ] **Step 3: Write minimal implementation**

Create `ai-system/services/chat_service.py`:

```python
"""
Chat Service: Orchestrates the full RAG chat pipeline.
NLU → Retrieval → Rerank → Generation → Validation
"""
import asyncio
import logging

from api.schemas import ChatResponse, NLUInfo, SourceDocument
from nlu import query_processor
from retrieval import query_builder, hybrid_retriever, reranker
from generation import prompt_builder, llm_client, response_validator

logger = logging.getLogger(__name__)


class ChatService:
    async def process_chat(self, query: str) -> ChatResponse:
        """
        Process a chat query through the full RAG pipeline.

        Args:
            query: User's question in Vietnamese

        Returns:
            ChatResponse with answer, sources, and metadata
        """
        # Step 1: NLU Processing
        nlu_result = await asyncio.to_thread(
            query_processor.process_query, query
        )

        # Create NLU info
        nlu_info = NLUInfo(
            intent=nlu_result.intent,
            confidence=nlu_result.confidence,
            entities=[{"text": e.text, "type": e.entity_type} for e in nlu_result.entities],
            is_out_of_scope=nlu_result.is_out_of_scope,
        )

        # Step 2: Check out-of-scope
        if nlu_result.is_out_of_scope:
            return ChatResponse(
                query=query,
                response="Xin lỗi quý khách, em là AI hỗ trợ tư vấn thiết bị công nghệ của ShopWise. Câu hỏi này nằm ngoài phạm vi tư vấn của em ạ!",
                nlu_info=nlu_info,
                sources=[],
                validation_status={"is_valid": True, "reason": "out_of_scope_fast_reply"},
            )

        # Step 3: Build retrieval query
        retrieval_query = query_builder.build_retrieval_query(nlu_result)

        # Step 4: Hybrid retrieval
        raw_docs = await asyncio.to_thread(
            hybrid_retriever.retrieve, retrieval_query
        )

        # Step 5: Reranking
        reranked_docs = await asyncio.to_thread(
            reranker.rerank_documents, query, raw_docs
        )

        # Step 6: Build prompt
        prompt = prompt_builder.build_prompt(query, reranked_docs, nlu_result)

        # Step 7: Generate response
        client = llm_client.get_llm_client()
        raw_response = await client.generate_response(prompt)

        # Step 8: Validate response
        validation = response_validator.validate_response(
            raw_response, reranked_docs, query
        )

        # Step 9: Build source documents
        source_docs = [
            SourceDocument(
                id=d.id,
                text=d.text,
                metadata=d.metadata,
                score=d.score,
            )
            for d in reranked_docs
        ]

        # Step 10: Return response
        return ChatResponse(
            query=query,
            response=validation.sanitized_response,
            nlu_info=nlu_info,
            sources=source_docs,
            validation_status={
                "is_valid": validation.is_valid,
                "faithfulness_score": round(validation.faithfulness_score, 2),
                "numerical_consistency": validation.numerical_consistency,
                "issues": validation.issues,
            },
        )


# Singleton instance
_chat_service = None


def get_chat_service() -> ChatService:
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai-system && python -m pytest tests/test_chat_service.py -v`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add ai-system/services/chat_service.py ai-system/tests/test_chat_service.py
git commit -m "feat: implement ChatService for RAG pipeline orchestration"
```

---

### Task 5.2: Update Chat Router to Use ChatService

**Files:**
- Modify: `ai-system/api/routers/chat.py`

**Interfaces:**
- Consumes: `ChatService`
- Produces: Updated `/chat` endpoint using service layer

- [ ] **Step 1: Update chat.py to use ChatService**

Replace `ai-system/api/routers/chat.py`:

```python
"""
FastAPI Router cho Endpoint Chat RAG.
Sử dụng ChatService để orchestrate toàn bộ pipeline.
"""
import logging

from fastapi import APIRouter, HTTPException

from api.schemas import ChatRequest, ChatResponse
from services.chat_service import get_chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat-rag"])


@router.post("", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest):
    """
    Process chat query through RAG pipeline.

    Steps:
    1. Validate input
    2. Process through ChatService (NLU → Retrieval → Rerank → Generation → Validation)
    3. Return response
    """
    # Step 1: Validate input
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Câu hỏi truy vấn không được để rỗng.")

    # Step 2: Process through ChatService
    chat_service = get_chat_service()
    response = await chat_service.process_chat(query)

    # Step 3: Return response
    return response
```

- [ ] **Step 2: Run existing tests to verify no regression**

Run: `cd ai-system && python -m pytest tests/ -v`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add ai-system/api/routers/chat.py
git commit -m "refactor: update chat router to use ChatService"
```

---

## Phase 6: Polish & Optimization

### Task 6.1: Admin Stats Endpoint

**Files:**
- Create: `ai-system/api/routers/admin_stats.py`
- Modify: `ai-system/api/main.py`

**Interfaces:**
- Consumes: ChromaDB collection, BM25 index, TaskManager
- Produces: `GET /admin/stats` endpoint

- [ ] **Step 1: Create admin_stats.py**

Create `ai-system/api/routers/admin_stats.py`:

```python
"""
Admin Stats Router: Endpoints for monitoring RAG system.
"""
from fastapi import APIRouter

from indexing import vector_store, bm25_index
from services.task_manager import get_task_manager, TaskStatus

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_stats():
    """
    Get RAG system statistics.
    """
    task_manager = get_task_manager()

    # Get ChromaDB stats
    try:
        collection = vector_store._get_collection()
        total_chunks = collection.count()
    except Exception:
        total_chunks = 0

    # Get BM25 stats
    try:
        bm25_index._ensure_loaded()
        bm25_count = len(bm25_index._corpus)
    except Exception:
        bm25_count = 0

    # Count pending tasks
    pending_tasks = sum(
        1 for task in task_manager._tasks.values()
        if task["status"] in (TaskStatus.PENDING, TaskStatus.PROCESSING)
    )

    return {
        "total_chunks_chromadb": total_chunks,
        "total_chunks_bm25": bm25_count,
        "pending_tasks": pending_tasks,
    }


@router.post("/reindex")
async def reindex_all():
    """
    Trigger full reindex of all products.
    This is a long-running operation.
    """
    # TODO: Implement full reindex logic
    return {
        "status": "started",
        "message": "Full reindex initiated",
    }
```

- [ ] **Step 2: Update main.py**

Add to `ai-system/api/main.py`:

```python
from api.routers import admin_products, chat, stage_testing, sync, admin_stats

# ... existing code ...

app.include_router(admin_stats.router)
```

- [ ] **Step 3: Commit**

```bash
git add ai-system/api/routers/admin_stats.py ai-system/api/main.py
git commit -m "feat: add admin stats endpoint for monitoring"
```

---

### Task 6.2: Final Integration Testing

**Files:**
- Create: `ai-system/tests/test_integration.py`

**Interfaces:**
- Consumes: All services
- Produces: End-to-end test coverage

- [ ] **Step 1: Create integration test**

Create `ai-system/tests/test_integration.py`:

```python
"""
Integration tests for the RAG chatbot system.
These tests require a running server and database.
"""
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from api.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_chat_endpoint_requires_query():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/chat", json={"query": ""})
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_sync_endpoint_requires_api_key():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/sync/product/test-123")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_stats_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_chunks_chromadb" in data
        assert "total_chunks_bm25" in data
```

- [ ] **Step 2: Run integration tests**

Run: `cd ai-system && python -m pytest tests/test_integration.py -v`
Expected: PASS (4 tests)

- [ ] **Step 3: Commit**

```bash
git add ai-system/tests/test_integration.py
git commit -m "test: add integration tests for RAG system"
```

---

### Task 6.3: Documentation Update

**Files:**
- Create: `ai-system/README.md`

- [ ] **Step 1: Create README.md**

Create `ai-system/README.md`:

```markdown
# ShopWise RAG Chatbot AI System

Hệ thống RAG Chatbot tư vấn sản phẩm điện tử cho website ShopWise.

## Cấu trúc Project

```
ai-system/
├── api/                    # FastAPI API Layer
│   ├── routers/           # API endpoints
│   ├── middleware.py      # Authentication
│   └── schemas.py        # Pydantic models
├── config/                # Configuration
├── db/                    # Database access
├── data_pipeline/         # Data processing
├── embedding/             # BGE-M3 encoder
├── nlu/                   # NLU (PhoBERT)
├── indexing/              # ChromaDB + BM25
├── retrieval/             # Hybrid retrieval
├── generation/            # LLM generation
├── services/              # Business logic
└── tests/                 # Unit tests
```

## Cài đặt

1. Clone repository
2. Tạo virtual environment: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows) hoặc `source venv/bin/activate` (Linux/Mac)
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` và cập nhật configuration
6. Chạy server: `uvicorn api.main:app --reload --port 8000`

## API Endpoints

### Chat
- `POST /chat` - Gửi câu hỏi cho chatbot

### Sync (Java → Python)
- `POST /sync/product/{id}` - Trigger product ingestion
- `DELETE /sync/product/{id}` - Remove product from index
- `GET /sync/status/{task_id}` - Check task status

### Admin
- `GET /admin/stats` - System statistics

## Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_chunking.py

# Run with verbose output
pytest -v
```

## Architecture

```
User Query → NLU (PhoBERT) → Query Builder → Hybrid Retrieval (ChromaDB + BM25)
                                              ↓
                                     RRF Fusion → Reranker
                                              ↓
                                     Prompt Builder → LLM (Gemini)
                                              ↓
                                     Response Validator → User Response
```
```

- [ ] **Step 2: Commit**

```bash
git add ai-system/README.md
git commit -m "docs: add README for AI system"
```

---

## Summary

**Total Tasks:** 16 tasks across 6 phases

**Phase 1 (Core Foundation):** 4 tasks
- Environment configuration
- API key middleware
- Product repository
- Task manager

**Phase 2 (Ingestion Pipeline):** 3 tasks
- Smart chunking
- Ingestion service
- Sync API endpoints

**Phase 3 (Java Integration):** 3 tasks
- SyncService
- Configuration
- ProductService integration

**Phase 4 (Query Pipeline):** 2 tasks
- Enhanced NER
- Enhanced query builder

**Phase 5 (Chat Pipeline):** 2 tasks
- Chat service
- Chat router update

**Phase 6 (Polish):** 3 tasks
- Admin stats
- Integration tests
- Documentation

**Estimated Time:** 4 weeks (1 developer)

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-08-rag-chatbot-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
