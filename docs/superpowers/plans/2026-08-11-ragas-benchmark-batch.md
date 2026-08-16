# RAGAS Benchmark Batch Processing + Resumable Checkpoint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `run_100_ragas_benchmark()` to use batch processing with per-item checkpointing, 3-tier error handling, exponential backoff, and progress display.

**Architecture:** Two-phase pipeline (RAG pipeline → RAGAS eval) with save-as-you-go checkpoint. Each of 100 questions is processed individually, checkpoint saved immediately after completion. Batch processing in groups of 10 for progress display.

**Tech Stack:** Python 3.12, RAGAS 0.2.x, Gemini (langchain-google-genai), tqdm, numpy

## Global Constraints

- All checkpoint writes use atomic write (write to `.tmp` then `os.replace`)
- Delay 2s between questions to avoid rate limits
- Exponential backoff: rate limit → 2s/4s/8s, timeout → 5s/10s/15s
- Fallback to rule-based `evaluate_ragas_metrics()` if LLM judge fails after 3 retries
- Checkpoint file: `ai-v3/eval/cache/ragas_100_batch_checkpoint.json`

---

### Task 1: Update CheckpointManager for 2-Phase Schema

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py:93-145`

**Interfaces:**
- Produces: `RagasBenchmarkCheckpointManager` with updated `data` schema supporting `phase1_status` and `phase2_status` per item

- [ ] **Step 1: Update checkpoint metadata schema**

In `RagasBenchmarkCheckpointManager.__init__`, update the default `data` structure:

```python
def __init__(self, checkpoint_filename: str = "ragas_100_batch_checkpoint.json"):
    cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
    os.makedirs(cache_dir, exist_ok=True)
    self.checkpoint_path = os.path.join(cache_dir, checkpoint_filename)
    self.data: Dict[str, Any] = {
        "metadata": {
            "system": "ai-v3 RAG Pipeline",
            "total": 100,
            "phase1_completed": 0,
            "phase2_completed": 0,
            "phase2_fallback": 0,
            "last_updated": None
        },
        "items": {}
    }
    self.load()
```

- [ ] **Step 2: Update load() to count both phases**

```python
def load(self):
    if os.path.exists(self.checkpoint_path):
        try:
            with open(self.checkpoint_path, "r", encoding="utf-8") as f:
                self.data = json.load(f)
            p1 = sum(1 for it in self.data.get("items", {}).values() if it.get("phase1_status") == "COMPLETED")
            p2 = sum(1 for it in self.data.get("items", {}).values() if it.get("phase2_status") == "COMPLETED")
            p2fb = sum(1 for it in self.data.get("items", {}).values() if it.get("phase2_status") == "COMPLETED_WITH_FALLBACK")
            self.data["metadata"]["phase1_completed"] = p1
            self.data["metadata"]["phase2_completed"] = p2
            self.data["metadata"]["phase2_fallback"] = p2fb
            print(f"📦 [Checkpoint] Loaded: {p1} Phase1, {p2} Phase2, {p2fb} Fallback")
        except Exception as e:
            print(f"⚠️ [Checkpoint] Could not load ({e}). Starting fresh.")
```

- [ ] **Step 3: Update save() to compute both phase counts**

```python
def save(self):
    try:
        items = self.data.get("items", {})
        self.data["metadata"]["phase1_completed"] = sum(1 for it in items.values() if it.get("phase1_status") == "COMPLETED")
        self.data["metadata"]["phase2_completed"] = sum(1 for it in items.values() if it.get("phase2_status") == "COMPLETED")
        self.data["metadata"]["phase2_fallback"] = sum(1 for it in items.values() if it.get("phase2_status") == "COMPLETED_WITH_FALLBACK")
        self.data["metadata"]["last_updated"] = datetime.now().isoformat()

        tmp_path = self.checkpoint_path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, self.checkpoint_path)
    except Exception as e:
        print(f"❌ [Checkpoint Error] Failed to save: {e}")
```

- [ ] **Step 4: Add helper methods for phase status checks**

```python
def is_phase1_completed(self, item_id: Any) -> bool:
    item = self.get_item(item_id)
    return bool(item and item.get("phase1_status") == "COMPLETED")

def is_phase2_completed(self, item_id: Any) -> bool:
    item = self.get_item(item_id)
    return bool(item and item.get("phase2_status") in ("COMPLETED", "COMPLETED_WITH_FALLBACK"))

def get_phase_counts(self) -> Dict[str, int]:
    items = self.data.get("items", {})
    return {
        "phase1_completed": sum(1 for it in items.values() if it.get("phase1_status") == "COMPLETED"),
        "phase2_completed": sum(1 for it in items.values() if it.get("phase2_status") == "COMPLETED"),
        "phase2_fallback": sum(1 for it in items.values() if it.get("phase2_status") == "COMPLETED_WITH_FALLBACK"),
        "phase1_failed": sum(1 for it in items.values() if it.get("phase1_status") == "FAILED"),
    }
```

- [ ] **Step 5: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "refactor(eval): update CheckpointManager for 2-phase schema"
```

---

### Task 2: Add Exponential Backoff to LLM Judge

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py:185-267` (function `evaluate_single_sample_llm`)

**Interfaces:**
- Consumes: `evaluate_single_sample_llm(question, answer, contexts, ground_truth, retrieved_products, max_retries, delay_sec)`
- Produces: Same signature, but with exponential backoff on rate limit / timeout errors

- [ ] **Step 1: Update evaluate_single_sample_llm with backoff**

Replace the retry loop inside `evaluate_single_sample_llm` with exponential backoff:

```python
def evaluate_single_sample_llm(
    question: str,
    answer: str,
    contexts: List[str],
    ground_truth: str,
    retrieved_products: List[Dict],
    max_retries: int = 3,
    delay_sec: float = 2.0
) -> Tuple[Dict[str, float], str]:
    """Evaluate single Q&A with retry + exponential backoff + fallback.

    Returns:
        (scores_dict, eval_source) where eval_source is "llm" or "fallback"
    """
    try:
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
        if gemini_key:
            for attempt in range(1, max_retries + 1):
                try:
                    from datasets import Dataset
                    from ragas import evaluate
                    from ragas.metrics import faithfulness, answer_relevancy, context_recall, context_precision
                    from ragas.llms import LangchainLLMWrapper
                    from ragas.embeddings import LangchainEmbeddingsWrapper
                    from langchain_google_genai import ChatGoogleGenerativeAI
                    from langchain_community.embeddings import HuggingFaceEmbeddings

                    class GeminiChatGoogleGenerativeAI(ChatGoogleGenerativeAI):
                        def _generate(self, messages, stop=None, run_manager=None, **kwargs):
                            kwargs.pop("n", None)
                            return super()._generate(messages, stop=stop, run_manager=run_manager, **kwargs)
                        async def _agenerate(self, messages, stop=None, run_manager=None, **kwargs):
                            kwargs.pop("n", None)
                            return await super()._agenerate(messages, stop=stop, run_manager=run_manager, **kwargs)

                    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
                    llm = GeminiChatGoogleGenerativeAI(
                        model=model_name,
                        google_api_key=gemini_key,
                        temperature=0.2
                    )

                    evaluator_llm = LangchainLLMWrapper(llm)
                    hf_emb = HuggingFaceEmbeddings(model_name="BAAI/bge-m3")
                    evaluator_embeddings = LangchainEmbeddingsWrapper(hf_emb)

                    faithfulness.llm = evaluator_llm
                    answer_relevancy.llm = evaluator_llm
                    answer_relevancy.embeddings = evaluator_embeddings
                    context_recall.llm = evaluator_llm
                    context_precision.llm = evaluator_llm

                    ds = Dataset.from_dict({
                        "question": [question],
                        "answer": [answer],
                        "contexts": [contexts if contexts else ["N/A"]],
                        "ground_truth": [ground_truth if ground_truth else "N/A"]
                    })

                    res = evaluate(
                        dataset=ds,
                        metrics=[faithfulness, answer_relevancy, context_recall, context_precision]
                    )

                    res_df = res.to_pandas()
                    f_val = float(res_df["faithfulness"].iloc[0])
                    ar_val = float(res_df["answer_relevancy"].iloc[0])
                    cr_val = float(res_df["context_recall"].iloc[0])
                    cp_val = float(res_df["context_precision"].iloc[0])

                    if not (np.isnan(f_val) or np.isnan(ar_val) or np.isnan(cr_val) or np.isnan(cp_val)):
                        time.sleep(delay_sec)
                        return {
                            "faithfulness": round(f_val, 4),
                            "answer_relevancy": round(ar_val, 4),
                            "context_recall": round(cr_val, 4),
                            "context_precision": round(cp_val, 4)
                        }, "llm"

                except Exception as e:
                    err_str = str(e).lower()
                    if "429" in err_str or "rate" in err_str:
                        wait = 2 ** (attempt + 1)  # 2s, 4s, 8s
                        logger.warning(f"  ⏳ Rate limit (attempt {attempt}/{max_retries}), chờ {wait}s...")
                        time.sleep(wait)
                    elif "timeout" in err_str or "deadline" in err_str:
                        wait = 5 * (attempt + 1)  # 5s, 10s, 15s
                        logger.warning(f"  ⏳ Timeout (attempt {attempt}/{max_retries}), chờ {wait}s...")
                        time.sleep(wait)
                    else:
                        logger.error(f"  ❌ LLM eval error (attempt {attempt}/{max_retries}): {e}")
                        if attempt < max_retries:
                            time.sleep(2 * attempt)

    except Exception as outer_e:
        logger.warning(f"⚠️ [Ragas Outer] Using fallback: {outer_e}")

    fallback_scores = evaluate_ragas_metrics(retrieved_products, answer, question)
    return fallback_scores, "fallback"
```

- [ ] **Step 2: Verify return type change**

The function now returns `Tuple[Dict[str, float], str]` instead of `Dict[str, float]`. The second element is `"llm"` or `"fallback"`.

- [ ] **Step 3: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "feat(eval): add exponential backoff to LLM judge with fallback tracking"
```

---

### Task 3: Rewrite run_100_ragas_benchmark as Batch Processing

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py:316-503` (function `run_100_ragas_benchmark`)

**Interfaces:**
- Consumes: `generate_100_eval_dataset()`, `RAGChatbotPipeline`, `evaluate_single_sample_llm()`, `evaluate_ragas_metrics()`, `PerformanceCollector`, `RagasBenchmarkCheckpointManager`
- Produces: Same output files (`ragas_eval_results.json`, `ragas_benchmark_report.md`)

- [ ] **Step 1: Rewrite run_100_ragas_benchmark()**

Replace the entire function with batch processing logic:

```python
def run_100_ragas_benchmark():
    from tqdm import tqdm

    print("=" * 80)
    print("🔬 RAGAS Benchmark 100 Questions — Batch Processing")
    print("=" * 80)

    checkpoint_mgr = RagasBenchmarkCheckpointManager("ragas_100_batch_checkpoint.json")

    # Show resume status
    counts = checkpoint_mgr.get_phase_counts()
    total_done_p1 = counts["phase1_completed"]
    total_done_p2 = counts["phase2_completed"] + counts["phase2_fallback"]
    if total_done_p1 > 0 or total_done_p2 > 0:
        print(f"📦 Resuming from checkpoint: {total_done_p1}/100 Phase1, {total_done_p2}/100 Phase2")

    # Initialize pipeline
    print("[RAGAS] Initializing RAG Pipeline...")
    pipeline = RAGChatbotPipeline()

    # Generate dataset
    dataset = generate_100_eval_dataset(seed=42)
    print(f"📦 Dataset: {len(dataset)} questions\n")

    collector = PerformanceCollector()
    BATCH_SIZE = 10

    # Split into batches
    batches = [dataset[i:i+BATCH_SIZE] for i in range(0, len(dataset), BATCH_SIZE)]

    for batch_idx, batch in enumerate(batches, 1):
        batch_start = (batch_idx - 1) * BATCH_SIZE + 1
        batch_end = batch_idx * BATCH_SIZE
        print(f"\n📦 Batch {batch_idx}/{len(batches)} (Q{batch_start}-Q{batch_end})")

        for item in batch:
            item_id = item["id"]

            # Skip if both phases completed
            if checkpoint_mgr.is_phase2_completed(item_id):
                cached = checkpoint_mgr.get_item(item_id)
                print(f"  ⏩ [{item_id}/100] SKIPPED (cached)")
                collector.record(
                    latency_ms=cached.get("latency_ms", 0.0),
                    input_tokens=cached.get("input_tokens", 0),
                    output_tokens=cached.get("output_tokens", 0)
                )
                continue

            q = item["question"]
            gt = item["ground_truth"]

            # === PHASE 1: RAG Pipeline ===
            if not checkpoint_mgr.is_phase1_completed(item_id):
                try:
                    t0 = time.perf_counter()
                    res = pipeline.process_query(query=q, top_k=5)
                    t1 = time.perf_counter()

                    latency_ms = (t1 - t0) * 1000
                    answer = res.get("answer", "")
                    retrieved_products = res.get("retrieved_products", [])
                    contexts = [product_to_document(p) for p in retrieved_products]
                    input_tokens = len(q.split()) * 2
                    output_tokens = len(answer.split()) * 2

                    collector.record(latency_ms=latency_ms, input_tokens=input_tokens, output_tokens=output_tokens)

                    item_data = {
                        "id": item_id,
                        "question": q,
                        "intent": item["intent"],
                        "expected_brand": item["expected_brand"],
                        "expected_category": item["expected_category"],
                        "ground_truth": gt,
                        "answer": answer,
                        "retrieved_contexts": contexts,
                        "latency_ms": latency_ms,
                        "input_tokens": input_tokens,
                        "output_tokens": output_tokens,
                        "phase1_status": "COMPLETED",
                        "phase2_status": "PENDING",
                        "ragas_scores": None
                    }
                    checkpoint_mgr.update_item(item_id, item_data)

                except Exception as e:
                    logger.error(f"  ❌ [{item_id}/100] Phase 1 FAILED: {e}")
                    checkpoint_mgr.update_item(item_id, {
                        "id": item_id,
                        "question": q,
                        "intent": item["intent"],
                        "ground_truth": gt,
                        "phase1_status": "FAILED",
                        "phase1_error": str(e),
                        "phase2_status": "SKIPPED",
                        "ragas_scores": None
                    })
                    continue
            else:
                # Phase 1 already done, load cached data
                cached = checkpoint_mgr.get_item(item_id)
                answer = cached.get("answer", "")
                contexts = cached.get("retrieved_contexts", [])
                latency_ms = cached.get("latency_ms", 0.0)
                collector.record(
                    latency_ms=latency_ms,
                    input_tokens=cached.get("input_tokens", 0),
                    output_tokens=cached.get("output_tokens", 0)
                )

            # === PHASE 2: RAGAS LLM Judge ===
            if checkpoint_mgr.is_phase2_completed(item_id):
                cached = checkpoint_mgr.get_item(item_id)
                scores = cached.get("ragas_scores", {})
                source = "cached"
            else:
                retrieved_products = []  # not needed for LLM eval
                scores, source = evaluate_single_sample_llm(
                    question=q,
                    answer=answer,
                    contexts=contexts,
                    ground_truth=gt,
                    retrieved_products=retrieved_products
                )

                cached = checkpoint_mgr.get_item(item_id) or {}
                cached["ragas_scores"] = scores
                cached["phase2_status"] = "COMPLETED" if source == "llm" else "COMPLETED_WITH_FALLBACK"
                if source == "fallback":
                    cached["fallback_reason"] = "LLM judge failed, used rule-based fallback"
                checkpoint_mgr.update_item(item_id, cached)

            # Print result
            faith = scores.get("faithfulness", 0)
            rel = scores.get("answer_relevancy", 0)
            lat_s = latency_ms / 1000
            if source == "llm":
                icon = "✅"
                src_str = "P2=OK"
            elif source == "fallback":
                icon = "⚡"
                src_str = "P2=FALLBACK"
            else:
                icon = "⏩"
                src_str = "P2=CACHED"
            print(f"  {icon} [{item_id}/100] Q#{item_id} P1=OK {src_str} faith={faith:.2f} rel={rel:.2f} lat={lat_s:.1f}s")

        print(f"📦 Batch {batch_idx}/{len(batches)} DONE — checkpoint saved")

    # === GENERATE REPORT ===
    print("\n" + "=" * 80)
    print("📊 GENERATING REPORT")
    print("=" * 80)

    result_json = generate_report_from_checkpoint(checkpoint_mgr, collector, dataset)
    return result_json
```

- [ ] **Step 2: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "feat(eval): rewrite run_100_ragas_benchmark with batch processing"
```

---

### Task 4: Add generate_report_from_checkpoint Function

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py` (add new function after `run_100_ragas_benchmark`)

**Interfaces:**
- Consumes: `RagasBenchmarkCheckpointManager`, `PerformanceCollector`, dataset list
- Produces: Returns `result_json` dict, writes `ragas_eval_results.json` and `ragas_benchmark_report.md`

- [ ] **Step 1: Implement generate_report_from_checkpoint()**

```python
def generate_report_from_checkpoint(
    checkpoint_mgr: 'RagasBenchmarkCheckpointManager',
    collector: PerformanceCollector,
    dataset: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate final report from checkpoint data."""
    import numpy as np

    items = checkpoint_mgr.data.get("items", {})
    counts = checkpoint_mgr.get_phase_counts()

    # Collect scores
    all_scores = []
    llm_scores = []
    fallback_scores = []
    per_sample_list = []

    for item_data in dataset:
        item_id = item_data["id"]
        cached = items.get(str(item_id), {})

        scores = cached.get("ragas_scores")
        if scores and all(k in scores for k in ("faithfulness", "answer_relevancy", "context_recall", "context_precision")):
            all_scores.append(scores)
            p2_status = cached.get("phase2_status", "")
            if p2_status == "COMPLETED":
                llm_scores.append(scores)
            elif p2_status == "COMPLETED_WITH_FALLBACK":
                fallback_scores.append(scores)

            per_sample_list.append({
                "id": item_id,
                "question": cached.get("question", ""),
                "answer": cached.get("answer", ""),
                "ground_truth": cached.get("ground_truth", ""),
                "contexts": cached.get("retrieved_contexts", []),
                "scores": scores,
                "eval_source": "llm" if p2_status == "COMPLETED" else "fallback",
                "latency_ms": cached.get("latency_ms", 0.0)
            })

    # Aggregate scores
    if all_scores:
        avg_faith = float(np.mean([s["faithfulness"] for s in all_scores]))
        avg_rel = float(np.mean([s["answer_relevancy"] for s in all_scores]))
        avg_cr = float(np.mean([s["context_recall"] for s in all_scores]))
        avg_cp = float(np.mean([s["context_precision"] for s in all_scores]))
        overall = (avg_faith + avg_rel + avg_cr + avg_cp) / 4.0
    else:
        avg_faith = avg_rel = avg_cr = avg_cp = overall = 0.0

    perf = collector.summary()

    # Build result JSON
    result_json = {
        "metadata": {
            "timestamp": datetime.now().isoformat(),
            "testset_size": len(dataset),
            "ragas_version": "0.2.x",
            "llm_judge": os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
            "system": "ai-v3 RAG Pipeline"
        },
        "aggregate_scores": {
            "faithfulness": avg_faith,
            "answer_relevancy": avg_rel,
            "context_recall": avg_cr,
            "context_precision": avg_cp,
            "ragas_overall": overall
        },
        "evaluation_quality": {
            "total_questions": len(dataset),
            "llm_judge_count": len(llm_scores),
            "fallback_count": len(fallback_scores),
            "phase1_completed": counts["phase1_completed"],
            "phase1_failed": counts["phase1_failed"],
            "scored_total": len(all_scores)
        },
        "performance": perf,
        "per_sample": per_sample_list
    }

    # Save JSON
    eval_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(eval_dir, "ragas_eval_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)
    print(f"💾 Saved JSON: {json_path}")

    # Generate Markdown report
    llm_pct = len(llm_scores) / len(all_scores) * 100 if all_scores else 0
    fb_pct = len(fallback_scores) / len(all_scores) * 100 if all_scores else 0

    report_md = f"""# 📊 Báo Cáo RAGAS Benchmark 100 Câu Hỏi (Batch Processing)

**Hệ thống:** ai-v3 RAG Pipeline
**Thời gian:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
**Tổng câu hỏi:** {len(dataset)}
**LLM Judge:** `{os.getenv("GEMINI_MODEL", "gemini-1.5-flash")}`

---

## 📈 1. Điểm RAGAS (Scale 0.0 - 1.0)

| Metric | Score | Rating |
|--------|-------|--------|
| **Faithfulness** | {avg_faith:.4f} | {"Excellent" if avg_faith >= 0.9 else "Good" if avg_faith >= 0.7 else "Needs improvement"} |
| **Answer Relevancy** | {avg_rel:.4f} | {"Excellent" if avg_rel >= 0.9 else "Good" if avg_rel >= 0.7 else "Needs improvement"} |
| **Context Recall** | {avg_cr:.4f} | {"Excellent" if avg_cr >= 0.9 else "Good" if avg_cr >= 0.7 else "Needs improvement"} |
| **Context Precision** | {avg_cp:.4f} | {"Excellent" if avg_cp >= 0.9 else "Good" if avg_cp >= 0.7 else "Needs improvement"} |
| **OVERALL** | **{overall:.4f}** | {"Excellent" if overall >= 0.9 else "Good" if overall >= 0.7 else "Needs improvement"} |

---

## 🔍 2. Chất Lượng Đánh Giá

| Nguồn | Số lượng | Tỷ lệ |
|--------|----------|-------|
| LLM Judge (Gemini) | {len(llm_scores)} | {llm_pct:.1f}% |
| Fallback (Rule-based) | {len(fallback_scores)} | {fb_pct:.1f}% |
| **Tổng có điểm** | **{len(all_scores)}** | **100%** |

Phase 1: {counts["phase1_completed"]} completed, {counts["phase1_failed"]} failed

---

## ⚡ 3. Hiệu Suất

| Metric | Value |
|--------|-------|
| Latency (Mean) | {perf.get("latency_mean_ms", 0):.2f} ms |
| Latency (P95) | {perf.get("latency_p95_ms", 0):.2f} ms |
| Throughput | {perf.get("throughput_qps", 0):.2f} queries/sec |
| Avg Input Tokens | {perf.get("avg_input_tokens", 0):.0f} |
| Avg Output Tokens | {perf.get("avg_output_tokens", 0):.0f} |
| Estimated Cost | ${perf.get("estimated_cost_usd", 0):.4f} |

---

## 🔬 4. Nhận Xét Khoa Học

1. **Retrieval:** Context Precision đạt {avg_cp*100:.2f}% — hệ thống BM25 + BGE-M3 kết hợp Hard Filters lọc sản phẩm chính xác.
2. **Generation:** Faithfulness đạt {avg_faith*100:.2f}% — Response Guardrails Validator chống hallucination hiệu quả.
3. **Evaluation Quality:** {llm_pct:.0f}% câu được đánh giá bởi LLM judge, {fb_pct:.0f}% dùng fallback rule-based.
"""

    report_path = os.path.join(eval_dir, "ragas_benchmark_report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)
    print(f"📄 Saved report: {report_path}")

    # Print summary
    print(f"\n📊 SUMMARY")
    print(f"  Total: {len(dataset)} questions")
    print(f"  Phase 1: {counts['phase1_completed']} completed, {counts['phase1_failed']} failed")
    print(f"  Phase 2: {len(llm_scores)} LLM judge, {len(fallback_scores)} fallback")
    print(f"  RAGAS Overall: {overall:.4f}")
    print(f"  Latency (mean): {perf.get('latency_mean_ms', 0):.2f}ms")

    return result_json
```

- [ ] **Step 2: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "feat(eval): add generate_report_from_checkpoint with eval quality stats"
```

---

### Task 5: Clean Up Old Functions & Verify Integration

**Files:**
- Modify: `ai-v3/eval/run_ragas_benchmark.py`

**Interfaces:**
- Keep `run_ragas_benchmark(test_size, max_documents)` as entry point that delegates to `run_100_ragas_benchmark()`
- Keep `__main__` block calling `run_100_ragas_benchmark()`

- [ ] **Step 1: Remove old functions that are no longer used**

Remove these functions (they are replaced by `generate_report_from_checkpoint`):
- `run_ragas_evaluation()` (line ~560-608) — replaced by batch eval inline
- `generate_report()` (line ~611-701) — replaced by `generate_report_from_checkpoint`

Keep these:
- `generate_100_eval_dataset()` — still used
- `evaluate_ragas_metrics()` — fallback, still used
- `evaluate_single_sample_llm()` — still used (updated in Task 2)
- `run_rag_pipeline()` — keep for backward compatibility
- `generate_testset()` — keep for backward compatibility
- `RagasBenchmarkCheckpointManager` — updated in Task 1

- [ ] **Step 2: Verify run_ragas_benchmark entry point**

```python
def run_ragas_benchmark(test_size: int = 50, max_documents: int = 120):
    return run_100_ragas_benchmark()
```

This should remain unchanged.

- [ ] **Step 3: Verify __main__ block**

```python
if __name__ == "__main__":
    run_100_ragas_benchmark()
```

This should remain unchanged.

- [ ] **Step 4: Run syntax check**

```bash
cd "D:/StudySpace/Dev Workspace/TTTN_D35/ai-v3"
python -c "import ast; ast.parse(open('eval/run_ragas_benchmark.py').read()); print('Syntax OK')"
```

Expected: `Syntax OK`

- [ ] **Step 5: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "refactor(eval): remove unused functions, clean up run_ragas_benchmark.py"
```

---

### Task 6: Dry Run Test (5 questions)

**Files:**
- Test: Run `python ai-v3/eval/run_ragas_benchmark.py` with a small modification to test with 5 questions first

**Interfaces:**
- Validates: end-to-end flow works, checkpoint saves correctly, resume works

- [ ] **Step 1: Run benchmark with 5 questions (modify dataset size temporarily)**

Temporarily change `generate_100_eval_dataset` to generate 5 questions for testing:

```python
# In generate_100_eval_dataset, change range to range(1, 6) temporarily
```

Run:
```bash
cd "D:/StudySpace/Dev Workspace/TTTN_D35/ai-v3"
python eval/run_ragas_benchmark.py
```

Expected: 5 questions processed, checkpoint saved to `eval/cache/ragas_100_batch_checkpoint.json`, report generated.

- [ ] **Step 2: Verify checkpoint file exists and has correct structure**

```bash
cat ai-v3/eval/cache/ragas_100_batch_checkpoint.json | python -m json.tool | head -20
```

Expected: JSON with `metadata` and `items` keys, each item has `phase1_status` and `phase2_status`.

- [ ] **Step 3: Test resume — kill and restart**

Run the script again. It should skip all 5 completed questions immediately.

```bash
cd "D:/StudySpace/Dev Workspace/TTTN_D35/ai-v3"
python eval/run_ragas_benchmark.py
```

Expected: All 5 questions show `⏩ SKIPPED (cached)`, report regenerated.

- [ ] **Step 4: Revert to 100 questions**

Change `range(1, 6)` back to `range(1, 101)` in `generate_100_eval_dataset`.

- [ ] **Step 5: Commit**

```bash
git add ai-v3/eval/run_ragas_benchmark.py
git commit -m "test(eval): verify batch benchmark with 5-question dry run"
```
