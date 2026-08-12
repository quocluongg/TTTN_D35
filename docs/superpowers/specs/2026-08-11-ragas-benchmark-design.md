# RAGAS Benchmark Design — Batch Processing + Resumable Checkpoint

**Date:** 2026-08-11
**Author:** KZ | Quoc Luong
**Status:** Approved
**Approach:** 3 — Batch processing + progress bar + resume thông minh

---

## 1. Overview

### 1.1 Problem Statement

Benchmark RAGAS cho ai-v3 chạy 100 câu hỏi bị fail liên tục do:
- Gemini API rate limit (429)
- API timeout / slow response
- Script crash → mất toàn bộ progress, phải chạy lại từ đầu
- Checkpoint hiện tại chỉ lưu 1 file → nếu crash giữa chừng thì dữ liệu không recover được

### 1.2 Goals

- Chạy benchmark 100 câu hỏi với RAGAS LLM-as-judge (Gemini)
- **Save-as-you-go:** mỗi câu hoàn thành → save checkpoint ngay
- **Resume thông minh:** restart → skip câu đã completed, chạy tiếp câu chưa xong
- **Batch processing:** chia 10 batch × 10 câu, mỗi batch save riêng
- **3 tầng error handling:** pipeline → RAGAS eval → fallback rule-based
- **Progress bar:** thấy rõ tiến độ realtime

### 1.3 Non-Goals

- Không so sánh A/B với baseline khác
- Không human evaluation
- Không ablation study
- Không deploy benchmark lên production

---

## 2. Architecture

### 2.1 Two-Phase Pipeline

```
Phase 1: RAG Pipeline (process_query → answer + contexts)
         ↓ save phase1_status = COMPLETED per item
Phase 2: RAGAS Evaluation (LLM judge → 4 scores)
         ↓ save phase2_status = COMPLETED per item
Report:  Aggregate từ checkpoint → JSON + Markdown
```

### 2.2 Batch Flow

```
Batch 1 (Q1-Q10)   → run → save checkpoint
Batch 2 (Q11-Q20)  → run → save checkpoint
...
Batch 10 (Q91-Q100) → run → save checkpoint
```

Mỗi batch chạy tuần tự 10 câu. Mỗi câu save checkpoint NGAY sau khi hoàn thành.

### 2.3 Per-Question Flow

```
┌─────────────────────────────────────────────┐
│ 1. Kiểm tra checkpoint                      │
│    ├─ phase1 == COMPLETED → skip, dùng cache│
│    └─ phase1 != COMPLETED → chạy Phase 1    │
│                                             │
│ 2. Phase 1: RAG Pipeline                    │
│    ├─ try: process_query()                  │
│    │   → answer + contexts + latency        │
│    ├─ except: phase1_status = "FAILED"      │
│    └─ save checkpoint                       │
│                                             │
│ 3. Phase 2: RAGAS LLM Judge                 │
│    ├─ Kiểm tra phase2 == COMPLETED → skip   │
│    ├─ try: evaluate_single_sample_llm()     │
│    │   ├─ Retry 3 lần, exponential backoff  │
│    │   ├─ 429 → wait 2s → 4s → 8s          │
│    │   ├─ timeout → wait 5s → 10s → 15s    │
│    │   └─ Nếu 3 lần fail → fallback         │
│    ├─ except: fallback rule-based scores    │
│    └─ save checkpoint                       │
│                                             │
│ 4. Delay 2s trước câu tiếp theo            │
└─────────────────────────────────────────────┘
```

---

## 3. Checkpoint Structure

**File:** `ai-v3/eval/cache/ragas_100_batch_checkpoint.json`

```json
{
  "metadata": {
    "total": 100,
    "phase1_completed": 45,
    "phase2_completed": 30,
    "phase2_fallback": 5,
    "last_updated": "2026-08-11T14:00:00"
  },
  "items": {
    "1": {
      "id": 1,
      "question": "Tư vấn cho mình Laptop Gaming Asus RAM 16GB SSD 512GB giá tầm 25 triệu",
      "intent": "PURCHASE_CONSULTATION",
      "expected_brand": "Asus",
      "expected_category": "Laptop Gaming",
      "ground_truth": "Sản phẩm Laptop Gaming của thương hiệu Asus...",
      "answer": "Dạ, dựa trên yêu cầu...",
      "retrieved_contexts": ["Tên sản phẩm: ...\nHãng: Asus\n..."],
      "latency_ms": 8500.0,
      "input_tokens": 20,
      "output_tokens": 150,
      "phase1_status": "COMPLETED",
      "ragas_scores": {
        "faithfulness": 0.95,
        "answer_relevancy": 0.88,
        "context_recall": 0.75,
        "context_precision": 0.90
      },
      "phase2_status": "COMPLETED"
    },
    "2": {
      "id": 2,
      "question": "...",
      "phase1_status": "COMPLETED",
      "answer": "...",
      "retrieved_contexts": ["..."],
      "latency_ms": 9200.0,
      "phase2_status": "COMPLETED_WITH_FALLBACK",
      "ragas_scores": {
        "faithfulness": 0.85,
        "answer_relevancy": 0.90,
        "context_recall": 0.70,
        "context_precision": 0.80
      },
      "fallback_reason": "Gemini timeout after 3 retries"
    },
    "3": {
      "id": 3,
      "phase1_status": "FAILED",
      "phase1_error": "Pipeline connection error",
      "phase2_status": "SKIPPED"
    }
  }
}
```

### Status Values

| Phase | Status | Meaning |
|-------|--------|---------|
| phase1 | `PENDING` | Chưa chạy |
| phase1 | `COMPLETED` | RAG pipeline thành công |
| phase1 | `FAILED` | Pipeline lỗi |
| phase2 | `PENDING` | Chưa chạy |
| phase2 | `COMPLETED` | LLM judge thành công |
| phase2 | `COMPLETED_WITH_FALLBACK` | LLM fail, dùng rule-based |
| phase2 | `SKIPPED` | Phase 1 failed nên skip |
| phase2 | `FAILED` | Cả LLM lẫn fallback đều fail |

---

## 4. Error Handling Strategy

### 4.1 Three-Tier Protection

| Tier | Scope | Strategy |
|------|-------|----------|
| **Tier 1** | RAG Pipeline (`process_query`) | try/catch → `phase1_status=FAILED`, skip Phase 2 |
| **Tier 2** | RAGAS LLM Judge | Retry 3×, exponential backoff |
| **Tier 3** | Fallback Rule-based | Dùng `evaluate_ragas_metrics()` nếu LLM fail |

### 4.2 Exponential Backoff

```python
for attempt in range(3):
    try:
        # call Gemini LLM judge
        break
    except Exception as e:
        err_str = str(e).lower()
        if "429" in err_str or "rate" in err_str:
            wait = 2 ** (attempt + 1)  # 2s, 4s, 8s
            logger.warning(f"Rate limit, chờ {wait}s...")
            time.sleep(wait)
        elif "timeout" in err_str or "deadline" in err_str:
            wait = 5 * (attempt + 1)  # 5s, 10s, 15s
            logger.warning(f"Timeout, chờ {wait}s...")
            time.sleep(wait)
        else:
            logger.error(f"Unknown error: {e}")
            break  # → fallback immediately
```

### 4.3 Delay Between Calls

- Giữa các câu: **2s** (tăng từ 1s hiện tại)
- Sau khi gặp rate limit: backoff tự xử lý, không thêm delay extra

---

## 5. Progress Output

### 5.1 Terminal Output

```
🔬 RAGAS Benchmark 100 Questions — Batch Processing
=====================================================
📦 Loaded checkpoint: 45/100 Phase1, 30/100 Phase2

📦 Batch 1/10 (Q1-Q10)
  ✅ [1/100]  Q#1   P1=OK  P2=OK       faith=0.95 rel=0.88 lat=8.5s
  ✅ [2/100]  Q#2   P1=OK  P2=OK       faith=0.91 rel=0.85 lat=9.2s
  ⚡ [3/100]  Q#3   P1=OK  P2=FALLBACK faith=0.85 rel=0.90 lat=8.8s
  ⏩ [4/100]  Q#4   SKIPPED (cached)
  ✅ [5/100]  Q#5   P1=OK  P2=OK       faith=0.93 rel=0.90 lat=7.9s
  ❌ [6/100]  Q#6   P1=FAILED pipeline error
  ...
📦 Batch 1/10 DONE — saved checkpoint

📦 Batch 2/10 (Q11-Q20)
  ...

📊 REPORT
=====================================================
Total: 100 questions
Phase 1: 95 completed, 5 failed
Phase 2: 80 LLM judge, 15 fallback, 5 skipped

RAGAS Scores (avg):
  Faithfulness:     0.92
  Answer Relevancy: 0.88
  Context Recall:   0.78
  Context Precision: 0.85
  OVERALL:          0.86

Performance:
  Latency (mean): 8500ms
  Latency (P95):  12000ms
  Throughput:     0.12 queries/sec
```

---

## 6. Report Generation

### 6.1 Aggregate Calculation

```python
# Đọc checkpoint
items = checkpoint["items"]

# Tính scores
llm_scores = []      # câu dùng LLM judge
fallback_scores = [] # câu dùng fallback
all_scores = []

for item in items.values():
    if item.get("ragas_scores"):
        all_scores.append(item["ragas_scores"])
        if item.get("phase2_status") == "COMPLETED":
            llm_scores.append(item["ragas_scores"])
        else:
            fallback_scores.append(item["ragas_scores"])

# Aggregate
avg_faithfulness = np.mean([s["faithfulness"] for s in all_scores])
# ...tương tự cho 3 metrics còn lại

# Thống kê quality
llm_count = len(llm_scores)
fallback_count = len(fallback_scores)
```

### 6.2 Report Sections

1. **Metadata** — timestamp, testset_size, llm_judge model
2. **RAGAS Scores** — 4 metrics + overall, bảng đánh giá
3. **Evaluation Quality** — X/100 dùng LLM judge, Y/100 dùng fallback
4. **Performance** — latency, throughput, tokens, cost
5. **Per-Intent Breakdown** — scores theo intent (nếu có)
6. **Scientific Analysis** — nhận xét cho đồ án tốt nghiệp

### 6.3 Output Files

- `ai-v3/eval/ragas_eval_results.json` — full JSON results
- `ai-v3/eval/ragas_benchmark_report.md` — Markdown report
- `ai-v3/eval/cache/ragas_100_batch_checkpoint.json` — checkpoint (giữ nguyên để resume)

---

## 7. Implementation Changes

### 7.1 File: `ai-v3/eval/run_ragas_benchmark.py`

**Giữ nguyên:**
- `generate_100_eval_dataset()` — dataset generation
- `evaluate_ragas_metrics()` — fallback rule-based
- `evaluate_single_sample_llm()` — RAGAS LLM judge (thêm backoff)
- `generate_report()` — report generation

**Thay đổi:**
- `RagasBenchmarkCheckpointManager` — update schema cho 2-phase
- `run_100_ragas_benchmark()` — rewrite thành batch processing
- Thêm `tqdm` import cho progress display

**Thêm mới:**
- `run_phase1_batch()` — chạy RAG pipeline cho 1 batch
- `run_phase2_batch()` — chạy RAGAS eval cho 1 batch
- `generate_interim_report()` — tạo report từ checkpoint bất cứ lúc nào

### 7.2 Dependencies

```txt
# Đã có trong project
ragas>=0.2.0
langchain-google-genai>=2.0.0
datasets>=2.14.0
numpy
pandas

# Thêm mới
tqdm  # progress bar
```

---

## 8. Success Criteria

| Criteria | Target |
|----------|--------|
| Benchmark chạy thành công | ≥ 90/100 câu (cả LLM + fallback) |
| Resume hoạt động | Kill script giữa chừng → restart → chạy tiếp |
| 4 RAGAS metrics có giá trị | 0.0 - 1.0 range, không NaN |
| Checkpoint save đúng | Mỗi câu xong → checkpoint update ngay |
| Thời gian chạy | < 30 phút cho 100 câu |
| Chi phí API | < $1 USD |

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini rate limit liên tục | Medium | Exponential backoff + delay 2s giữa câu |
| Checkpoint file corruption | High | Atomic write (tmp → replace) |
| Phase 1 fail nhiều | Medium | Log rõ error, có thể debug sau |
| Fallback scores inflate kết quả | Low | Report tách biệt LLM vs fallback count |

---

**End of Design Document**
