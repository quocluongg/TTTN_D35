# RAGAS Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the heuristic RAGAS implementation in `ai-v3/eval/run_ragas_benchmark.py` with official RAGAS library using Gemini 3.1 Flash Lite as LLM judge.

**Architecture:** Single-file rewrite of `run_ragas_benchmark.py` that uses RAGAS TestsetGen to auto-generate eval dataset from product catalog, runs RAGAS `evaluate()` with 4 core metrics, collects performance metrics, and outputs JSON + Markdown reports.

**Tech Stack:** Python 3.10+, ragas>=0.2.0, langchain-google-genai, datasets, google-generativeai, sentence-transformers (BGE-M3)

## Global Constraints

- LLM Judge: `gemini-3.1-flash-lite` via `ChatGoogleGenerativeAI`
- Embeddings: reuse BGE-M3 from `ai-v3/core/embeddings.py`
- Test size: 100 test cases
- Output directory: `ai-v3/eval/`
- All Vietnamese text for reports
- Python encoding: UTF-8 (Windows compatible)

---

### Task 1: Add RAGAS Dependencies

**Files:**
- Modify: `ai-v3/requirements.txt`

**Interfaces:**
- Produces: Updated `requirements.txt` with ragas, langchain-google-genai, datasets

- [ ] **Step 1: Read current requirements.txt**

Read `ai-v3/requirements.txt` to see current dependencies.

- [ ] **Step 2: Add new dependencies**

Append to `ai-v3/requirements.txt`:

```txt
# RAGAS Benchmark
ragas>=0.2.0
langchain-google-genai>=2.0.0
datasets>=2.14.0
```

- [ ] **Step 3: Install dependencies**

Run: `cd ai-v3 && pip install ragas langchain-google-genai datasets`

Expected: Successfully installed packages

- [ ] **Step 4: Verify installation**

Run: `python -c "import ragas; print(ragas.__version__)"`

Expected: Version number printed (e.g., `0.2.x`)

- [ ] **Step 5: Commit**

```bash
git add ai-v3/requirements.txt
git commit -m "deps: add ragas, langchain-google-genai, datasets for benchmark"
```

---

### Task 2: Implement PerformanceCollector Class

**Files:**
- Create: `ai-v3/eval/performance_collector.py`
- Test: `ai-v3/eval/test_performance_collector.py`

**Interfaces:**
- Produces: `PerformanceCollector` class with `record()`, `summary()` methods

- [ ] **Step 1: Write the failing test**

Create `ai-v3/eval/test_performance_collector.py`:

```python
"""Tests for PerformanceCollector."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import numpy as np
from eval.performance_collector import PerformanceCollector


def test_record_single_measurement():
    """Test recording a single performance measurement."""
    collector = PerformanceCollector()
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    
    assert len(collector.latencies) == 1
    assert collector.latencies[0] == 100.0
    assert collector.input_tokens[0] == 500
    assert collector.output_tokens[0] == 100


def test_record_multiple_measurements():
    """Test recording multiple measurements."""
    collector = PerformanceCollector()
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    collector.record(latency_ms=200.0, input_tokens=600, output_tokens=150)
    collector.record(latency_ms=150.0, input_tokens=550, output_tokens=120)
    
    assert len(collector.latencies) == 3
    assert len(collector.input_tokens) == 3
    assert len(collector.output_tokens) == 3


def test_summary_statistics():
    """Test summary returns correct statistics."""
    collector = PerformanceCollector()
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    collector.record(latency_ms=200.0, input_tokens=600, output_tokens=150)
    collector.record(latency_ms=300.0, input_tokens=700, output_tokens=200)
    
    summary = collector.summary()
    
    assert summary["latency_mean_ms"] == 200.0
    assert summary["latency_p50_ms"] == 200.0
    assert summary["latency_p95_ms"] == 300.0  # 95th percentile
    assert summary["avg_input_tokens"] == 600.0
    assert summary["avg_output_tokens"] == 150.0
    assert summary["total_input_tokens"] == 1800
    assert summary["total_output_tokens"] == 450


def test_throughput_calculation():
    """Test throughput is calculated correctly."""
    collector = PerformanceCollector()
    # 3 queries, each 100ms = 300ms total = 10 QPS
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    collector.record(latency_ms=100.0, input_tokens=500, output_tokens=100)
    
    summary = collector.summary()
    assert summary["throughput_qps"] == pytest.approx(10.0)


def test_cost_estimation():
    """Test cost estimation based on Gemini 3.1 Flash Lite pricing."""
    collector = PerformanceCollector()
    # 1000 input tokens = $0.000015
    # 1000 output tokens = $0.00006
    collector.record(latency_ms=100.0, input_tokens=1000, output_tokens=1000)
    
    summary = collector.summary()
    expected_cost = 0.000015 + 0.00006  # $0.000075
    assert summary["estimated_cost_usd"] == pytest.approx(expected_cost)


def test_empty_collector():
    """Test summary with no measurements."""
    collector = PerformanceCollector()
    summary = collector.summary()
    
    assert summary["latency_mean_ms"] == 0.0
    assert summary["throughput_qps"] == 0.0
    assert summary["estimated_cost_usd"] == 0.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-v3 && python -m pytest eval/test_performance_collector.py -v`

Expected: FAIL with "ModuleNotFoundError: No module named 'eval.performance_collector'"

- [ ] **Step 3: Write minimal implementation**

Create `ai-v3/eval/performance_collector.py`:

```python
"""Performance metrics collector for RAGAS benchmark."""
import numpy as np
from typing import List


class PerformanceCollector:
    """Collects and summarizes performance metrics during benchmark execution."""
    
    # Gemini 3.1 Flash Lite pricing (per 1K tokens)
    INPUT_COST_PER_1K = 0.000015
    OUTPUT_COST_PER_1K = 0.00006
    
    def __init__(self):
        self.latencies: List[float] = []
        self.input_tokens: List[int] = []
        self.output_tokens: List[int] = []
    
    def record(self, latency_ms: float, input_tokens: int, output_tokens: int):
        """Record a single performance measurement."""
        self.latencies.append(latency_ms)
        self.input_tokens.append(input_tokens)
        self.output_tokens.append(output_tokens)
    
    def summary(self) -> dict:
        """Calculate summary statistics for all recorded measurements."""
        if not self.latencies:
            return {
                "latency_mean_ms": 0.0,
                "latency_p50_ms": 0.0,
                "latency_p95_ms": 0.0,
                "latency_p99_ms": 0.0,
                "throughput_qps": 0.0,
                "avg_input_tokens": 0.0,
                "avg_output_tokens": 0.0,
                "total_input_tokens": 0,
                "total_output_tokens": 0,
                "estimated_cost_usd": 0.0
            }
        
        return {
            "latency_mean_ms": float(np.mean(self.latencies)),
            "latency_p50_ms": float(np.percentile(self.latencies, 50)),
            "latency_p95_ms": float(np.percentile(self.latencies, 95)),
            "latency_p99_ms": float(np.percentile(self.latencies, 99)),
            "throughput_qps": len(self.latencies) / (sum(self.latencies) / 1000),
            "avg_input_tokens": float(np.mean(self.input_tokens)),
            "avg_output_tokens": float(np.mean(self.output_tokens)),
            "total_input_tokens": sum(self.input_tokens),
            "total_output_tokens": sum(self.output_tokens),
            "estimated_cost_usd": self._calc_cost()
        }
    
    def _calc_cost(self) -> float:
        """Calculate estimated API cost based on token counts."""
        input_cost = sum(self.input_tokens) / 1000 * self.INPUT_COST_PER_1K
        output_cost = sum(self.output_tokens) / 1000 * self.OUTPUT_COST_PER_1K
        return round(input_cost + output_cost, 6)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai-v3 && python -m pytest eval/test_performance_collector.py -v`

Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add ai-v3/eval/performance_collector.py ai-v3/eval/test_performance_collector.py
git commit -m "feat(eval): add PerformanceCollector for benchmark metrics"
```

---

### Task 3: Implement Document Preparation Helper

**Files:**
- Create: `ai-v3/eval/document_helper.py`
- Test: `ai-v3/eval/test_document_helper.py`

**Interfaces:**
- Produces: `product_to_document()` function, `load_products()` function

- [ ] **Step 1: Write the failing test**

Create `ai-v3/eval/test_document_helper.py`:

```python
"""Tests for document helper functions."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from eval.document_helper import product_to_document, load_products


def test_product_to_document_basic():
    """Test basic product to document conversion."""
    product = {
        "name": "Laptop ASUS ROG Strix G16",
        "brand": "ASUS",
        "category": "Laptop Gaming",
        "price": 42990000,
        "rating": 4.8,
        "specs": "RAM 32GB SSD 1TB RTX 4070",
        "description": "Laptop gaming cao cấp"
    }
    
    doc = product_to_document(product)
    
    assert "Laptop ASUS ROG Strix G16" in doc
    assert "ASUS" in doc
    assert "Laptop Gaming" in doc
    assert "42,990,000" in doc
    assert "RAM 32GB SSD 1TB RTX 4070" in doc


def test_product_to_document_missing_fields():
    """Test conversion with missing optional fields."""
    product = {
        "name": "Test Product",
        "brand": "Test",
        "category": "Test",
        "price": 1000000
    }
    
    doc = product_to_document(product)
    
    assert "Test Product" in doc
    assert "1,000,000" in doc
    assert "N/A" in doc  # rating missing


def test_product_to_document_with_specifications():
    """Test conversion with specifications dict."""
    product = {
        "name": "Test Laptop",
        "brand": "Test",
        "category": "Laptop",
        "price": 20000000,
        "rating": 4.5,
        "specifications": {"RAM": "16GB", "SSD": "512GB"}
    }
    
    doc = product_to_document(product)
    
    assert "16GB" in doc
    assert "512GB" in doc


def test_load_products_from_list():
    """Test loading products from a list."""
    products = [
        {"name": "P1", "brand": "A", "category": "C1", "price": 100},
        {"name": "P2", "brand": "B", "category": "C2", "price": 200}
    ]
    
    result = load_products(products=products)
    
    assert len(result) == 2
    assert result[0]["name"] == "P1"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ai-v3 && python -m pytest eval/test_document_helper.py -v`

Expected: FAIL with "ModuleNotFoundError: No module named 'eval.document_helper'"

- [ ] **Step 3: Write minimal implementation**

Create `ai-v3/eval/document_helper.py`:

```python
"""Helper functions for preparing documents for RAGAS TestsetGen."""
import sys
import os
import json
from typing import List, Dict, Any, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def product_to_document(product: dict) -> str:
    """Convert product dict to text document for RAGAS TestsetGen.
    
    Args:
        product: Product dictionary from database
        
    Returns:
        Formatted text document string
    """
    # Handle specifications - could be dict or string
    specs = product.get("specs", "")
    if not specs:
        specifications = product.get("specifications", {})
        if isinstance(specifications, dict):
            specs = ", ".join(f"{k}: {v}" for k, v in specifications.items())
        elif isinstance(specifications, str):
            try:
                specs_dict = json.loads(specifications)
                specs = ", ".join(f"{k}: {v}" for k, v in specs_dict.items())
            except Exception:
                specs = specifications
    
    price = product.get("price", 0)
    price_str = f"{price:,.0f}" if isinstance(price, (int, float)) and price > 0 else "Liên hệ"
    
    parts = [
        f"Tên sản phẩm: {product.get('name', 'N/A')}",
        f"Hãng: {product.get('brand', 'N/A')}",
        f"Danh mục: {product.get('category', 'N/A')}",
        f"Giá: {price_str} VNĐ",
        f"Đánh giá: {product.get('rating', 'N/A')}/5.0",
        f"Thông số: {specs}",
        f"Mô tả: {product.get('description', '')}",
    ]
    
    return "\n".join(parts)


def load_products(products: Optional[List[Dict]] = None) -> List[Dict[str, Any]]:
    """Load products from database or use provided list.
    
    Args:
        products: Optional list of products. If None, loads from DB.
        
    Returns:
        List of product dictionaries
    """
    if products is not None:
        return products
    
    try:
        from core.db import fetch_all_products
        products = fetch_all_products()
        if products:
            print(f"[DocumentHelper] Loaded {len(products)} products from database.")
            return products
    except Exception as e:
        print(f"[DocumentHelper] DB load failed: {e}")
    
    return []


def products_to_documents(products: List[Dict[str, Any]]) -> List[str]:
    """Convert list of products to list of document strings.
    
    Args:
        products: List of product dictionaries
        
    Returns:
        List of formatted document strings
    """
    return [product_to_document(p) for p in products]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ai-v3 && python -m pytest eval/test_document_helper.py -v`

Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add ai-v3/eval/document_helper.py ai-v3/eval/test_document_helper.py
git commit -m "feat(eval): add document helper for RAGAS testset generation"
```

---

### Task 4: Implement RAGAS Testset Generation

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py`

**Interfaces:**
- Consumes: `load_products()`, `product_to_document()` from `document_helper.py`
- Produces: `generate_testset()` function returning HuggingFace Dataset

- [ ] **Step 1: Read current run_ragas_benchmark.py**

Read `ai-v3/eval/run_ragas_benchmark.py` to understand existing structure.

- [ ] **Step 2: Write testset generation function**

Add to `ai-v3/eval/run_ragas_benchmark.py` (after imports):

```python
def generate_testset(products: List[Dict], test_size: int = 50) -> Any:
    """Generate eval testset using RAGAS TestsetGen.
    
    Args:
        products: List of product dictionaries
        test_size: Number of test cases to generate
        
    Returns:
        HuggingFace Dataset with columns: question, ground_truth, contexts
    """
    from langchain_core.documents import Document
    from ragas.testset import TestsetGenerator
    from langchain_google_genai import ChatGoogleGenerativeAI
    from sentence_transformers import SentenceTransformer
    
    print(f"[TestsetGen] Preparing {len(products)} products as documents...")
    
    # Convert products to LangChain Documents
    documents = []
    for product in products:
        doc_text = product_to_document(product)
        doc = Document(
            page_content=doc_text,
            metadata={
                "product_id": str(product.get("id", "")),
                "product_name": product.get("name", ""),
                "brand": product.get("brand", ""),
                "category": product.get("category", "")
            }
        )
        documents.append(doc)
    
    print(f"[TestsetGen] Initializing RAGAS TestsetGen with Gemini...")
    
    # Initialize LLM for testset generation
    llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite")
    
    # Initialize embeddings (reuse BGE-M3)
    embeddings_model = SentenceTransformer("BAAI/bge-m3")
    
    class LangChainEmbeddings:
        """Wrapper to make SentenceTransformer compatible with LangChain."""
        def embed_documents(self, texts):
            return embeddings_model.encode(texts, normalize_embeddings=True).tolist()
        
        def embed_query(self, text):
            return embeddings_model.encode([text], normalize_embeddings=True)[0].tolist()
    
    embeddings = LangChainEmbeddings()
    
    # Create testset generator
    generator = TestsetGenerator.from_langchain(
        llm=llm,
        embedding_model=embeddings
    )
    
    print(f"[TestsetGen] Generating {test_size} test cases...")
    
    # Generate testset
    testset = generator.generate_with_langchain_docs(
        documents=documents,
        test_size=test_size
    )
    
    print(f"[TestsetGen] Generated {len(testset)} test cases successfully!")
    
    return testset
```

- [ ] **Step 3: Verify function compiles**

Run: `cd ai-v3 && python -c "from eval.run_ragas_benchmark import generate_testset; print('OK')"`

Expected: `OK` printed

- [ ] **Step 4: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "feat(eval): add RAGAS testset generation function"
```

---

### Task 5: Implement RAG Pipeline Runner

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py`

**Interfaces:**
- Consumes: `RAGChatbotPipeline` from `core.pineline`, `PerformanceCollector`
- Produces: `run_rag_pipeline()` function

- [ ] **Step 1: Add run_rag_pipeline function**

Add to `ai-v3/eval/run_ragas_benchmark.py`:

```python
def run_rag_pipeline(
    questions: List[str],
    pipeline: Any = None,
    top_k: int = 5
) -> Tuple[List[str], List[List[str]], PerformanceCollector]:
    """Run RAG pipeline on list of questions and collect results.
    
    Args:
        questions: List of question strings
        pipeline: RAGChatbotPipeline instance (created if None)
        top_k: Number of top results to retrieve
        
    Returns:
        Tuple of (answers, retrieved_contexts, performance_collector)
    """
    from core.pineline import RAGChatbotPipeline
    from eval.performance_collector import PerformanceCollector
    import time
    
    if pipeline is None:
        print("[RAG Pipeline] Initializing RAG Chatbot Pipeline...")
        pipeline = RAGChatbotPipeline()
    
    collector = PerformanceCollector()
    answers = []
    retrieved_contexts = []
    
    print(f"[RAG Pipeline] Running {len(questions)} questions through pipeline...")
    
    for idx, question in enumerate(questions, 1):
        # Measure latency
        t0 = time.perf_counter()
        result = pipeline.process_query(query=question, top_k=top_k)
        t1 = time.perf_counter()
        
        latency_ms = (t1 - t0) * 1000
        
        # Extract answer and contexts
        answer = result.get("answer", "")
        products = result.get("retrieved_products", [])
        
        # Convert products to context strings for RAGAS
        contexts = []
        for p in products:
            context_text = product_to_document(p)
            contexts.append(context_text)
        
        answers.append(answer)
        retrieved_contexts.append(contexts)
        
        # Estimate tokens (rough approximation)
        input_tokens = len(question.split()) * 2  # rough estimate
        output_tokens = len(answer.split()) * 2   # rough estimate
        
        collector.record(
            latency_ms=latency_ms,
            input_tokens=input_tokens,
            output_tokens=output_tokens
        )
        
        if idx % 10 == 0 or idx == len(questions):
            print(f"  └─ Processed {idx}/{len(questions)} questions...")
    
    print(f"[RAG Pipeline] Completed! Average latency: {collector.summary()['latency_mean_ms']:.2f}ms")
    
    return answers, retrieved_contexts, collector
```

- [ ] **Step 2: Verify function compiles**

Run: `cd ai-v3 && python -c "from eval.run_ragas_benchmark import run_rag_pipeline; print('OK')"`

Expected: `OK` printed

- [ ] **Step 3: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "feat(eval): add RAG pipeline runner for benchmark"
```

---

### Task 6: Implement RAGAS Evaluation

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py`

**Interfaces:**
- Consumes: questions, answers, contexts, ground_truths
- Produces: `run_ragas_evaluation()` function returning evaluation results

- [ ] **Step 1: Add run_ragas_evaluation function**

Add to `ai-v3/eval/run_ragas_benchmark.py`:

```python
def run_ragas_evaluation(
    questions: List[str],
    answers: List[str],
    retrieved_contexts: List[List[str]],
    ground_truths: List[str]
) -> dict:
    """Run RAGAS evaluation on the generated answers.
    
    Args:
        questions: List of questions
        answers: List of generated answers
        retrieved_contexts: List of context lists (one per question)
        ground_truths: List of reference answers
        
    Returns:
        Dictionary with evaluation results
    """
    from datasets import Dataset
    from ragas import evaluate
    from ragas.metrics import faithfulness, answer_relevancy, context_recall, context_precision
    from langchain_google_genai import ChatGoogleGenerativeAI
    from sentence_transformers import SentenceTransformer
    
    print("[RAGAS Evaluation] Preparing dataset...")
    
    # Prepare dataset in RAGAS format
    dataset_dict = {
        "question": questions,
        "answer": answers,
        "contexts": retrieved_contexts,
        "ground_truth": ground_truths
    }
    
    dataset = Dataset.from_dict(dataset_dict)
    
    print("[RAGAS Evaluation] Initializing LLM judge (Gemini 3.1 Flash Lite)...")
    
    # Initialize LLM judge
    llm = ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite")
    
    # Initialize embeddings
    embeddings_model = SentenceTransformer("BAAI/bge-m3")
    
    class LangChainEmbeddings:
        """Wrapper to make SentenceTransformer compatible with LangChain."""
        def embed_documents(self, texts):
            return embeddings_model.encode(texts, normalize_embeddings=True).tolist()
        
        def embed_query(self, text):
            return embeddings_model.encode([text], normalize_embeddings=True)[0].tolist()
    
    embeddings = LangChainEmbeddings()
    
    print("[RAGAS Evaluation] Running evaluation with 4 metrics...")
    print("  - Faithfulness")
    print("  - Answer Relevancy")
    print("  - Context Recall")
    print("  - Context Precision")
    
    # Run evaluation
    result = evaluate(
        dataset=dataset,
        metrics=[faithfulness, answer_relevancy, context_recall, context_precision],
        llm=llm,
        embeddings=embeddings
    )
    
    print("[RAGAS Evaluation] Evaluation complete!")
    
    return result
```

- [ ] **Step 2: Verify function compiles**

Run: `cd ai-v3 && python -c "from eval.run_ragas_benchmark import run_ragas_evaluation; print('OK')"`

Expected: `OK` printed

- [ ] **Step 3: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "feat(eval): add RAGAS evaluation function"
```

---

### Task 7: Implement Report Generation

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py`

**Interfaces:**
- Consumes: ragas_result, performance_summary, testset
- Produces: `generate_report()` function

- [ ] **Step 1: Add generate_report function**

Add to `ai-v3/eval/run_ragas_benchmark.py`:

```python
def generate_report(
    ragas_result: dict,
    performance_summary: dict,
    testset: Any,
    output_dir: str = None
) -> Tuple[str, str]:
    """Generate benchmark report in JSON and Markdown format.
    
    Args:
        ragas_result: RAGAS evaluation result
        performance_summary: PerformanceCollector summary
        testset: RAGAS testset Dataset
        output_dir: Output directory (defaults to eval/)
        
    Returns:
        Tuple of (json_path, md_path)
    """
    import json
    from datetime import datetime
    
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Get aggregate scores from RAGAS result
    result_df = ragas_result.to_pandas()
    
    aggregate_scores = {
        "faithfulness": float(result_df["faithfulness"].mean()),
        "answer_relevancy": float(result_df["answer_relevancy"].mean()),
        "context_recall": float(result_df["context_recall"].mean()),
        "context_precision": float(result_df["context_precision"].mean()),
    }
    aggregate_scores["ragas_overall"] = float(np.mean(list(aggregate_scores.values())))
    
    # Build per-sample results
    per_sample = []
    for idx, row in result_df.iterrows():
        sample = {
            "id": idx,
            "question": row.get("question", ""),
            "answer": row.get("answer", ""),
            "ground_truth": row.get("ground_truth", ""),
            "contexts": row.get("contexts", []),
            "scores": {
                "faithfulness": float(row.get("faithfulness", 0)),
                "answer_relevancy": float(row.get("answer_relevancy", 0)),
                "context_recall": float(row.get("context_recall", 0)),
                "context_precision": float(row.get("context_precision", 0)),
            }
        }
        per_sample.append(sample)
    
    # Build full result JSON
    result_json = {
        "metadata": {
            "timestamp": datetime.now().isoformat(),
            "testset_size": len(testset),
            "ragas_version": "0.2.x",
            "llm_judge": "gemini-3.1-flash-lite",
            "system": "ai-v3 RAG Pipeline"
        },
        "aggregate_scores": aggregate_scores,
        "performance": performance_summary,
        "per_sample": per_sample
    }
    
    # Save JSON
    json_path = os.path.join(output_dir, "ragas_eval_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)
    
    print(f"[Report] Saved JSON results to: {json_path}")
    
    # Generate Markdown report
    md_content = f"""# 📊 Báo Cáo RAGAS Benchmark - Hệ Thống RAG Chatbot (ai-v3)

**Thời gian:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Số test cases:** {len(testset)}  
**LLM Judge:** Gemini 3.1 Flash Lite  
**Hệ thống:** ai-v3 RAG Pipeline  

---

## 📈 1. Bảng Điểm RAGAS (Scale 0.0 - 1.0)

| Metric | Điểm | Đánh Giá |
|--------|------|----------|
| **Faithfulness** | {aggregate_scores["faithfulness"]:.4f} | {"Xuất sắc" if aggregate_scores["faithfulness"] >= 0.9 else "Tốt" if aggregate_scores["faithfulness"] >= 0.7 else "Cần cải thiện"} |
| **Answer Relevancy** | {aggregate_scores["answer_relevancy"]:.4f} | {"Xuất sắc" if aggregate_scores["answer_relevancy"] >= 0.9 else "Tốt" if aggregate_scores["answer_relevancy"] >= 0.7 else "Cần cải thiện"} |
| **Context Recall** | {aggregate_scores["context_recall"]:.4f} | {"Xuất sắc" if aggregate_scores["context_recall"] >= 0.9 else "Tốt" if aggregate_scores["context_recall"] >= 0.7 else "Cần cải thiện"} |
| **Context Precision** | {aggregate_scores["context_precision"]:.4f} | {"Xuất sắc" if aggregate_scores["context_precision"] >= 0.9 else "Tốt" if aggregate_scores["context_precision"] >= 0.7 else "Cần cải thiện"} |
| **TỔNG THỂ** | **{aggregate_scores["ragas_overall"]:.4f}** | {"🚀 Xuất sắc" if aggregate_scores["ragas_overall"] >= 0.9 else "✅ Tốt" if aggregate_scores["ragas_overall"] >= 0.7 else "⚠️ Cần cải thiện"} |

---

## ⚡ 2. Hiệu Năng (Performance Metrics)

| Metric | Giá Trị |
|--------|---------|
| **Latency (Mean)** | {performance_summary["latency_mean_ms"]:.2f} ms |
| **Latency (P95)** | {performance_summary["latency_p95_ms"]:.2f} ms |
| **Throughput** | {performance_summary["throughput_qps"]:.2f} queries/sec |
| **Avg Input Tokens** | {performance_summary["avg_input_tokens"]:.0f} |
| **Avg Output Tokens** | {performance_summary["avg_output_tokens"]:.0f} |
| **Estimated Cost** | ${performance_summary["estimated_cost_usd"]:.4f} |

---

## 🔍 3. Giải Thích Metrics

- **Faithfulness:** Đo mức độ câu trả lời dựa trên ngữ cảnh (chống hallucination). Cao = ít bịa đặt.
- **Answer Relevancy:** Đo mức độ câu trả lời liên quan đến câu hỏi. Cao = trả lời đúng trọng tâm.
- **Context Recall:** Đo mức độ ngữ cảnh bao phủ câu trả lời đúng. Cao = không bỏ sót thông tin.
- **Context Precision:** Đo mức độ ngữ cảnh truy xuất chính xác. Cao = ít noise.

---

## 💡 4. Khuyến Nghị Cải Thiện

{"- Điểm Faithfulness cao: hệ thống chống hallucination tốt." if aggregate_scores["faithfulness"] >= 0.8 else "- Cần cải thiện prompt để giảm hallucination."}
{"- Điểm Answer Relevancy cao: câu trả lời bám sát câu hỏi." if aggregate_scores["answer_relevancy"] >= 0.8 else "- Cần cải thiện NLU để hiểu câu hỏi tốt hơn."}
{"- Điểm Context Recall cao: retrieval bao phủ tốt." if aggregate_scores["context_recall"] >= 0.8 else "- Cần cải thiện retrieval để bao phủ nhiều thông tin hơn."}
{"- Điểm Context Precision cao: retrieval chính xác." if aggregate_scores["context_precision"] >= 0.8 else "- Cần cải thiện reranking để lọc noise."}

---

**Kết luận:** Hệ thống RAG Chatbot đạt điểm RAGAS tổng thể **{aggregate_scores["ragas_overall"]:.2f}** ({aggregate_scores["ragas_overall"]*100:.1f}%), {"đạt chuẩn xuất sắc cho đồ án tốt nghiệp." if aggregate_scores["ragas_overall"] >= 0.8 else "cần cải thiện thêm để đạt chuẩn tốt nghiệp."}
"""
    
    md_path = os.path.join(output_dir, "ragas_benchmark_report.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    
    print(f"[Report] Saved Markdown report to: {md_path}")
    
    return json_path, md_path
```

- [ ] **Step 2: Verify function compiles**

Run: `cd ai-v3 && python -c "from eval.run_ragas_benchmark import generate_report; print('OK')"`

Expected: `OK` printed

- [ ] **Step 3: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "feat(eval): add report generation for RAGAS benchmark"
```

---

### Task 8: Implement Main Benchmark Runner

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py`

**Interfaces:**
- Consumes: All previous functions
- Produces: `run_ragas_benchmark()` main function

- [ ] **Step 1: Add main benchmark function**

Add to `ai-v3/eval/run_ragas_benchmark.py` (replace existing `run_100_ragas_benchmark`):

```python
def run_ragas_benchmark(test_size: int = 50):
    """Main function to run complete RAGAS benchmark.
    
    Args:
        test_size: Number of test cases to generate
    """
    print("=" * 80)
    print("🔬 RAGAS BENCHMARK - Hệ Thống RAG Chatbot (ai-v3)")
    print("=" * 80)
    
    # Step 1: Load products
    print("\n[Step 1/5] Loading product catalog...")
    products = load_products()
    if not products:
        print("❌ Error: No products found. Cannot run benchmark.")
        return
    print(f"✅ Loaded {len(products)} products")
    
    # Step 2: Generate testset
    print(f"\n[Step 2/5] Generating testset ({test_size} test cases)...")
    testset = generate_testset(products, test_size=test_size)
    print(f"✅ Generated {len(testset)} test cases")
    
    # Step 3: Run RAG pipeline
    print("\n[Step 3/5] Running RAG pipeline on test questions...")
    questions = testset["question"]
    ground_truths = testset["ground_truth"]
    answers, retrieved_contexts, perf_collector = run_rag_pipeline(questions)
    print(f"✅ Completed {len(questions)} queries")
    
    # Step 4: Run RAGAS evaluation
    print("\n[Step 4/5] Running RAGAS evaluation (LLM judge)...")
    ragas_result = run_ragas_evaluation(
        questions=questions,
        answers=answers,
        retrieved_contexts=retrieved_contexts,
        ground_truths=ground_truths
    )
    print("✅ RAGAS evaluation complete")
    
    # Step 5: Generate report
    print("\n[Step 5/5] Generating report...")
    json_path, md_path = generate_report(
        ragas_result=ragas_result,
        performance_summary=perf_collector.summary(),
        testset=testset
    )
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 KẾT QUẢ RAGAS BENCHMARK")
    print("=" * 80)
    
    result_df = ragas_result.to_pandas()
    print(f"Faithfulness:      {result_df['faithfulness'].mean():.4f}")
    print(f"Answer Relevancy:  {result_df['answer_relevancy'].mean():.4f}")
    print(f"Context Recall:    {result_df['context_recall'].mean():.4f}")
    print(f"Context Precision: {result_df['context_precision'].mean():.4f}")
    print(f"\nOverall RAGAS:    {result_df[['faithfulness','answer_relevancy','context_recall','context_precision']].mean().mean():.4f}")
    print(f"\nAvg Latency:      {perf_collector.summary()['latency_mean_ms']:.2f} ms")
    print(f"Estimated Cost:   ${perf_collector.summary()['estimated_cost_usd']:.4f}")
    
    print(f"\n📁 Reports saved to:")
    print(f"   JSON: {json_path}")
    print(f"   MD:   {md_path}")
    
    return ragas_result, perf_collector


if __name__ == "__main__":
    run_ragas_benchmark(test_size=50)
```

- [ ] **Step 2: Update module imports**

Ensure the imports at the top of `run_ragas_benchmark.py` include:

```python
import sys
import os
import time
import json
import numpy as np
from typing import List, Dict, Any, Tuple

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from eval.document_helper import product_to_document, load_products
from eval.performance_collector import PerformanceCollector
```

- [ ] **Step 3: Verify module compiles**

Run: `cd ai-v3 && python -c "from eval.run_ragas_benchmark import run_ragas_benchmark; print('OK')"`

Expected: `OK` printed

- [ ] **Step 4: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "feat(eval): add main RAGAS benchmark runner"
```

---

### Task 9: Run Full Benchmark

**Files:**
- None (execution only)

**Interfaces:**
- Consumes: `run_ragas_benchmark()` function
- Produces: `ragas_eval_results.json`, `ragas_benchmark_report.md`

- [ ] **Step 1: Verify Gemini API key is set**

Run: `cd ai-v3 && python -c "from config import get_settings; s = get_settings(); print('API Key set:', bool(s.GEMINI_API_KEY))"`

Expected: `API Key set: True`

- [ ] **Step 2: Run benchmark with small test size first**

Run: `cd ai-v3 && python eval/run_ragas_benchmark.py`

Expected:
- Testset generated successfully
- RAG pipeline runs on all questions
- RAGAS evaluation completes
- Reports generated

- [ ] **Step 3: Verify JSON output**

Run: `cd ai-v3 && python -c "import json; d = json.load(open('eval/ragas_eval_results.json')); print('Keys:', list(d.keys())); print('Scores:', d['aggregate_scores'])"`

Expected:
```
Keys: ['metadata', 'aggregate_scores', 'performance', 'per_sample']
Scores: {'faithfulness': X.XX, 'answer_relevancy': X.XX, ...}
```

- [ ] **Step 4: Verify Markdown report exists**

Run: `cd ai-v3 && head -20 eval/ragas_benchmark_report.md`

Expected: Markdown header with benchmark title and metadata

- [ ] **Step 5: Commit results**

```bash
git add ai-v3/eval/ragas_eval_results.json ai-v3/eval/ragas_benchmark_report.md
git commit -m "eval: add RAGAS benchmark results and report"
```

---

### Task 10: Cleanup and Documentation

**Files:**
- Modify: `ai-v3/eval/__init__.py`

**Interfaces:**
- None

- [ ] **Step 1: Update eval __init__.py**

Update `ai-v3/eval/__init__.py` to export new modules:

```python
"""Evaluation module for RAG Chatbot benchmarking."""

from eval.performance_collector import PerformanceCollector
from eval.document_helper import product_to_document, load_products

__all__ = [
    "PerformanceCollector",
    "product_to_document",
    "load_products"
]
```

- [ ] **Step 2: Verify imports work**

Run: `cd ai-v3 && python -c "from eval import PerformanceCollector, product_to_document; print('OK')"`

Expected: `OK` printed

- [ ] **Step 3: Final commit**

```bash
git add ai-v3/eval/__init__.py
git commit -m "eval: update __init__.py with new benchmark modules"
```

---

## Summary

| Task | Description | Files Modified/Created |
|------|-------------|------------------------|
| 1 | Add dependencies | `requirements.txt` |
| 2 | PerformanceCollector | `performance_collector.py`, test |
| 3 | Document helper | `document_helper.py`, test |
| 4 | Testset generation | `run_ragas_benchmark.py` |
| 5 | RAG pipeline runner | `run_ragas_benchmark.py` |
| 6 | RAGAS evaluation | `run_ragas_benchmark.py` |
| 7 | Report generation | `run_ragas_benchmark.py` |
| 8 | Main runner | `run_ragas_benchmark.py` |
| 9 | Run benchmark | Output files |
| 10 | Cleanup | `__init__.py` |

**Total files created:** 4 new files  
**Total files modified:** 3 existing files  
**Estimated time:** 30-45 minutes (excluding benchmark run time)
