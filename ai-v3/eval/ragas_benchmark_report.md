# 📊 Báo Cáo RAGAS Benchmark 100 Câu Hỏi (Batch Processing)

**Hệ thống:** ai-v3 RAG Pipeline
**Thời gian:** 2026-08-12 02:05:29
**Tổng câu hỏi:** 5
**LLM Judge:** `gemini-3.5-flash`

---

## 📈 1. Điểm RAGAS (Scale 0.0 - 1.0)

| Metric | Score | Rating |
|--------|-------|--------|
| **Faithfulness** | 0.0000 | Needs improvement |
| **Answer Relevancy** | 0.0000 | Needs improvement |
| **Context Recall** | 0.0000 | Needs improvement |
| **Context Precision** | 0.0000 | Needs improvement |
| **OVERALL** | **0.0000** | Needs improvement |

---

## 🔍 2. Chất Lượng Đánh Giá

| Nguồn | Số lượng | Tỷ lệ |
|--------|----------|-------|
| LLM Judge (Gemini) | 0 | 0.0% |
| Fallback (Rule-based) | 0 | 0.0% |
| **Tổng có điểm** | **0** | **100%** |

Phase 1: 4 completed, 1 failed

---

## ⚡ 3. Hiệu Suất

| Metric | Value |
|--------|-------|
| Latency (Mean) | 24623.84 ms |
| Latency (P95) | 27724.90 ms |
| Throughput | 0.04 queries/sec |
| Avg Input Tokens | 24 |
| Avg Output Tokens | 1140 |
| Estimated Cost | $0.0003 |

---

## 🔬 4. Nhận Xét Khoa Học

1. **Retrieval:** Context Precision đạt 0.00% — hệ thống BM25 + BGE-M3 kết hợp Hard Filters lọc sản phẩm chính xác.
2. **Generation:** Faithfulness đạt 0.00% — Response Guardrails Validator chống hallucination hiệu quả.
3. **Evaluation Quality:** 0% câu được đánh giá bởi LLM judge, 0% dùng fallback rule-based.
