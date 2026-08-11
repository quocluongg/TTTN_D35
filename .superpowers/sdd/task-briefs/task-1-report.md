# Task 1 Report: Fix Intent Label Mismatch

## Status: DONE

## Changes Made

**File modified:** `ai-system/nlu/intent_classifier.py` (lines 71-86, fallback block)

### Label renames (3 lines changed):
- `"price_query"` → `"ask_price"`
- `"comparison_query"` → `"compare_products"`
- `"spec_query"` → `"ask_specs"`

### New fallback rules added (6 lines):
- `"purchase_consultation"` for keywords: tư vấn, gợi ý, nên mua, recommend
- `"ask_warranty"` for keywords: bảo hành, warranty, đổi trả
- `"ask_promotion"` for keywords: khuyến mãi, giảm giá, promo, sale

## Verification

All 7 fallback labels verified against canonical sources:
- `INTENT_LABELS` in `config/constants.py`: all present
- `INTENT_CHUNK_MAP` in `retrieval/query_builder.py`: all have corresponding entries
- PhoBERT path (lines 83-119): untouched

## Commit

- `163fade` fix(nlu): align fallback intent labels with canonical INTENT_LABELS
