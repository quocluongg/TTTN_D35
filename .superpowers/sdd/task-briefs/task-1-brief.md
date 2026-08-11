# Task 1: Fix Intent Label Mismatch

## Problem
The fallback rule-based classifier in `intent_classifier.py` returns intent labels that don't match the canonical labels used in `config/constants.py` and `retrieval/query_builder.py`.

**Fallback returns:** `"price_query"`, `"comparison_query"`, `"spec_query"`
**Canonical labels:** `"ask_price"`, `"compare_products"`, `"ask_specs"`

When PhoBERT model is unavailable (common case since it requires `local_files_only=True`), the fallback intents never match `INTENT_CHUNK_MAP` in `query_builder.py`, so `preferred_chunk_types` always falls back to default `["description", "spec"]`.

## Requirements
1. In `ai-system/nlu/intent_classifier.py`, change the fallback rule-based labels to match canonical labels from `ai-system/config/constants.py`:
   - `"price_query"` → `"ask_price"`
   - `"comparison_query"` → `"compare_products"`
   - `"spec_query"` → `"ask_specs"`
2. Keep the same keyword matching logic, only change the returned label strings
3. Add `"purchase_consultation"` fallback for keywords like ["tư vấn", "gợi ý", "nên mua", "recommend"]
4. Add `"ask_warranty"` fallback for keywords like ["bảo hành", "warranty", "đổi trả"]
5. Add `"ask_promotion"` fallback for keywords like ["khuyến mãi", "giảm giá", "promo", "sale"]

## Files to Modify
- `ai-system/nlu/intent_classifier.py` (lines 72-80, the fallback block)

## Acceptance Criteria
- Fallback intent labels exactly match INTENT_LABELS in constants.py
- `query_builder.py` INTENT_CHUNK_MAP entries are hit correctly when fallback is used
- Existing PhoBERT path is unchanged
