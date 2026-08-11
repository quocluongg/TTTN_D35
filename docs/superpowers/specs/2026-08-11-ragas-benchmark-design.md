# RAGAS Benchmark Design for RAG Chatbot Evaluation

**Date:** 2026-08-11
**Author:** KZ | Quoc Luong
**Status:** Draft

---

## 1. Overview

### 1.1 Problem Statement

Hệ thống RAG Chatbot (ai-v3) hiện có module đánh giá (`ai-v3/eval/`) nhưng sử dụng heuristic tự viết cho RAGAS metrics — không chính xác, không đáng tin cậy cho đồ án tốt nghiệp. Cần thiết kế lại benchmark sử dụng official RAGAS framework với LLM-as-judge để có kết quả chuẩn, defend được khi bảo vệ.

### 1.2 Goals

- Sử dụng official RAGAS library (`pip install ragas`) với Gemini 3.1 Flash Lite làm LLM judge
- Tự动生成 eval dataset bằng RAGAS TestsetGen từ product catalog
- Đánh giá 4 core RAGAS metrics: Faithfulness, Answer Relevancy, Context Recall, Context Precision
- Thu thập performance metrics: Latency, Throughput, Token Usage, Cost
- Xuất báo cáo JSON + Markdown cho đồ án tốt nghiệp

### 1.3 Non-Goals

- Không so sánh A/B với baseline/hệ thống cũ (single system eval only)
- Không thực hiện human evaluation
- Không ablation study (với/không có reranker, MMR, etc.)
- Không deploy benchmark lên production

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RAGAS BENCHMARK PIPELINE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐     ┌──────────────────┐                     │
│  │  Product Catalog  │────▶│  RAGAS TestsetGen │                     │
│  │  (Supabase DB)    │     │  (KG-based)       │                     │
│  └──────────────────┘     └────────┬─────────┘                     │
│                                     │                               │
│                                     ▼                               │
│                          ┌──────────────────┐                       │
│                          │  Eval Dataset     │                       │
│                          │  (question,       │                       │
│                          │   ground_truth,   │                       │
│                          │   contexts)       │                       │
│                          └────────┬─────────┘                       │
│                                   │                                 │
│                    ┌──────────────┼──────────────┐                  │
│                    ▼                              ▼                  │
│  ┌─────────────────────────┐    ┌─────────────────────────┐        │
│  │  RAG Pipeline (ai-v3)   │    │  RAGAS evaluate()       │        │
│  │  - NLU → Retrieval →    │    │  - Faithfulness         │        │
│  │    Rerank → LLM →       │    │  - Answer Relevancy     │        │
│  │    Validate              │    │  - Context Recall       │        │
│  └──────────┬──────────────┘    │  - Context Precision    │        │
│             │                   └──────────┬──────────────┘        │
│             ▼                              ▼                        │
│  ┌─────────────────────────┐    ┌─────────────────────────┐        │
│  │  Performance Collector  │    │  RAGAS Results           │        │
│  │  - Latency              │    │  (per-sample + aggregate)│        │
│  │  - Token usage          │    └──────────┬──────────────┘        │
│  │  - Cost estimation      │               │                        │
│  └──────────┬──────────────┘               │                        │
│             │                              │                        │
│             └──────────────┬───────────────┘                        │
│                            ▼                                        │
│                 ┌─────────────────────┐                             │
│                 │  Benchmark Report   │                             │
│                 │  (Markdown + JSON)  │                             │
│                 └─────────────────────┘                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Testset Generation Phase:**
   - Load product catalog từ Supabase DB
   - Convert mỗi product thành `Document` object
   - RAGAS TestsetGen sinh test cases (question + ground_truth + contexts)
   - Lưu eval dataset ra file JSON/CSV

2. **Evaluation Phase:**
   - Load eval dataset
   - Với mỗi question → chạy RAG Pipeline → lấy answer + retrieved_contexts
   - Thu thập performance metrics (latency, tokens)
   - RAGAS `evaluate()` đánh giá 4 metrics bằng Gemini judge

3. **Reporting Phase:**
   - Tổng hợp aggregate scores
   - Xuất JSON results + Markdown report

---

## 3. RAGAS Testset Generation

### 3.1 Configuration

| Parameter | Value | Lý do |
|-----------|-------|-------|
| `test_size` | 100 | Đủ cho đồ án TN, kết quả chính xác hơn |
| `llm` | Gemini 3.1 Flash Lite | Rẻ, nhanh, user yêu cầu |
| `embedding` | BGE-M3 (reuse) | Đã có trong project |
| `query_synthesizers` | default (simple, multi_hop, reasoning) | Đa dạng câu hỏi |

### 3.2 Document Preparation

Mỗi product từ DB sẽ được convert thành text:

```python
def product_to_document(product: dict) -> str:
    """Convert product dict thành text document cho TestsetGen."""
    parts = [
        f"Tên sản phẩm: {product['name']}",
        f"Hãng: {product['brand']}",
        f"Danh mục: {product['category']}",
        f"Giá: {product['price']:,} VNĐ",
        f"Đánh giá: {product.get('rating', 'N/A')}/5.0",
        f"Thông số: {product.get('specs', '')}",
        f"Mô tả: {product.get('description', '')}",
    ]
    return "\n".join(parts)
```

### 3.3 Expected Output Format

RAGAS TestsetGen trả về HuggingFace Dataset với columns:
- `question`: câu hỏi sinh tự động
- `ground_truth`: câu trả lời đúng (reference answer)
- `contexts`: list[str] (reference contexts)
- `metadata`: các thông tin khác (synthesizer type, etc.)

---

## 4. RAGAS Evaluation Metrics

### 4.1 Four Core Metrics

| Metric | Ý nghĩa | Cơ chế LLM Judge |
|--------|----------|-------------------|
| **Faithfulness** | Answer có grounded trong context không? | Kiểm tra mỗi claim trong answer có supported bởi context |
| **Answer Relevancy** | Answer có liên quan đến question không? | Sinh N câu hỏi từ answer, tính cosine similarity với original question |
| **Context Recall** | Context có bao phủ ground_truth không? | Kiểm tra mỗi claim trong ground_truth có xuất hiện trong context |
| **Context Precision** | Context có chính xác/relevant không? | Đánh giá ranking của relevant contexts trong retrieved contexts |

### 4.2 LLM Judge Configuration

| Parameter | Value |
|-----------|-------|
| `llm` | `ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite")` |
| `embeddings` | BGE-M3 (reuse từ `ai-v3/core/embeddings.py`) |
| `timeout` | 60s per call |
| `max_retries` | 3 |

### 4.3 Evaluation Flow

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_recall, context_precision
from langchain_google_genai import ChatGoogleGenerativeAI

# Prepare dataset
dataset = Dataset.from_dict({
    "question": questions,           # từ testset
    "answer": answers,               # từ RAG pipeline
    "contexts": retrieved_contexts,  # từ RAG pipeline
    "ground_truth": ground_truths,   # từ testset
})

# Run evaluation
result = evaluate(
    dataset=dataset,
    metrics=[faithfulness, answer_relevancy, context_recall, context_precision],
    llm=ChatGoogleGenerativeAI(model="gemini-3.1-flash-lite"),
    embeddings=embeddings
)

# result.to_pandas() → DataFrame với per-sample scores
```

---

## 5. Performance Metrics

### 5.1 Metrics Collection

| Metric | Cách thu thập | Output |
|--------|--------------|--------|
| **Latency (ms)** | `time.perf_counter()` trước/sau mỗi query | Mean, P50, P95, P99 |
| **Throughput** | Tổng queries / total time | queries/sec |
| **Token Usage** | Đếm input/output tokens từ Gemini response | Mean tokens/query, total tokens |
| **Cost Estimation** | Token count × pricing | Total cost, cost/query |

### 5.2 Gemini 3.1 Flash Lite Pricing

| Direction | Price per 1K tokens |
|-----------|-------------------|
| Input | ~$0.000015 |
| Output | ~$0.00006 |

### 5.3 Implementation

```python
class PerformanceCollector:
    def __init__(self):
        self.latencies = []
        self.input_tokens = []
        self.output_tokens = []
    
    def record(self, latency_ms: float, input_tokens: int, output_tokens: int):
        self.latencies.append(latency_ms)
        self.input_tokens.append(input_tokens)
        self.output_tokens.append(output_tokens)
    
    def summary(self) -> dict:
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
        input_cost = sum(self.input_tokens) / 1000 * 0.000015
        output_cost = sum(self.output_tokens) / 1000 * 0.00006
        return round(input_cost + output_cost, 6)
```

---

## 6. Output Format

### 6.1 JSON Results (`ragas_eval_results.json`)

```json
{
  "metadata": {
    "timestamp": "2026-08-11T10:30:00Z",
    "testset_size": 50,
    "ragas_version": "0.2.x",
    "llm_judge": "gemini-3.1-flash-lite",
    "system": "ai-v3 RAG Pipeline"
  },
  "aggregate_scores": {
    "faithfulness": 0.87,
    "answer_relevancy": 0.91,
    "context_recall": 0.83,
    "context_precision": 0.89,
    "ragas_overall": 0.875
  },
  "performance": {
    "latency_mean_ms": 1250,
    "latency_p95_ms": 2100,
    "throughput_qps": 0.8,
    "avg_input_tokens": 1500,
    "avg_output_tokens": 350,
    "estimated_cost_usd": 0.12
  },
  "per_sample": [
    {
      "id": 0,
      "question": "...",
      "answer": "...",
      "ground_truth": "...",
      "contexts": ["..."],
      "retrieved_contexts": ["..."],
      "scores": {
        "faithfulness": 0.9,
        "answer_relevancy": 0.85,
        "context_recall": 0.8,
        "context_precision": 0.88
      },
      "latency_ms": 1100
    }
  ]
}
```

### 6.2 Markdown Report (`ragas_benchmark_report.md`)

Sections:
1. **Tổng quan** — mục tiêu, phương pháp, quy mô
2. **Bảng điểm RAGAS** — 4 metrics + overall score
3. **Performance Metrics** — latency, throughput, tokens, cost
4. **Phân tích theo loại câu hỏi** — nếu testset có metadata
5. **Ví dụ tốt/xấu** — 2-3 ví dụ minh họa
6. **So sánh với heuristic baseline** — điểm heuristic hiện tại vs RAGAS chính thức
7. **Recommendations** — cải thiện hệ thống

---

## 7. File Structure

```
ai-v3/eval/
├── run_ragas_benchmark.py      # REWRITE: official RAGAS benchmark
├── run_full_benchmark.py       # KEEP: recommender benchmark
├── benchmark_amazon_dataset.py # KEEP: Amazon scale test
├── metrics.py                  # KEEP: IR metrics
├── diversity.py                # KEEP: diversity metrics
├── significance.py             # KEEP: significance testing
├── ragas_eval_results.json     # NEW: RAGAS results
└── ragas_benchmark_report.md   # NEW: RAGAS report
```

---

## 8. Dependencies

### 8.1 New Dependencies (thêm vào requirements.txt)

```txt
# RAGAS Benchmark
ragas>=0.2.0
langchain-google-genai>=2.0.0
datasets>=2.14.0
```

### 8.2 Existing Dependencies (reuse)

```txt
# Already in project
google-generativeai  # Gemini API
sentence-transformers  # BGE-M3 embeddings
numpy
pandas
```

---

## 9. Implementation Steps

### Step 1: Setup Dependencies
- Cài đặt ragas, langchain-google-genai, datasets
- Verify Gemini API key hoạt động

### Step 2: Rewrite `run_ragas_benchmark.py`
- Implement TestsetGen flow
- Implement RAGAS evaluate() flow
- Implement PerformanceCollector
- Implement report generation

### Step 3: Run Benchmark
- Chạy benchmark trên 50 test cases
- Verify output format
- Review results

### Step 4: Generate Report
- Tạo JSON results
- Tạo Markdown report
- Commit to repo

---

## 10. Success Criteria

| Criteria | Target |
|----------|--------|
| RAGAS benchmark chạy thành công | 50/50 test cases |
| 4 metrics có giá trị hợp lý | 0.0 - 1.0 range |
| Performance metrics đầy đủ | Latency, throughput, tokens, cost |
| Report format chuẩn | JSON + Markdown |
| Thời gian chạy | < 30 phút cho 50 test cases |
| Chi phí API | < $1 USD |

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| RAGAS TestsetGen không hỗ trợ tiếng Việt tốt | Medium | Post-process hoặc custom prompt |
| Gemini API rate limit | Low | Add retry logic, exponential backoff |
| RAGAS evaluate() quá chậm | Low | Giảm test_size nếu cần |
| Chi phí API vượt budget | Low | Monitor cost, set limit |

---

**End of Design Document**
