# Task 5 Report: Fix Response Validator to Block Invalid Responses

## Status: DONE

## Changes Made

### `ai-system/generation/response_validator.py`

**5a -- Disclaimer prefix on validation failure:**
When `is_valid` is False (after Steps 3-5), `sanitized_response` now gets prepended with:
`"⚠️ Lưu ý: Thông tin số liệu dưới đây có thể chưa chính xác, quý khách vui lòng xác nhận lại với cửa hàng.\n\n"`
The original response content is preserved after the disclaimer.

**5b -- Empty context handling:**
The old code had a logic gap: if `context_docs` was empty and the response did NOT contain refusal keywords, execution fell through to Step 3 where `combined_context` would be an empty string, meaning any numbers or words in the response would be treated as hallucinated -- but the response would still pass through unchanged. Now:
- If `context_docs` is empty AND response contains refusal keywords -> `is_valid=True`, pass through (unchanged).
- If `context_docs` is empty AND response does NOT contain refusal keywords -> `is_valid=False`, return a standardized message: `"Xin lỗi, hiện tại hệ thống chưa có thông tin về sản phẩm này. Quý khách vui lòng liên hệ cửa hàng để được tư vấn chi tiết."` The hallucinated LLM output is discarded entirely.

**5c -- Faithfulness score in metadata:**
Already implemented in `chat_service.py` line 130 (`"faithfulness_score": round(validation.faithfulness_score, 2)`). No changes needed.

**Docstring fix:**
Updated Step 5 description from `>= 0.3` to `>= 0.5` to match the actual threshold set in Task 4.

### `ai-system/tests/test_response_validator.py`

Added 5 new tests:
- `test_disclaimer_prepended_when_validation_fails` -- verifies disclaimer prefix and original content preserved
- `test_disclaimer_not_prepended_when_valid` -- no disclaimer when validation passes
- `test_empty_context_with_refusal_response` -- refusal keywords on empty context -> valid
- `test_empty_context_with_non_refusal_response` -- non-refusal on empty context -> standardized message, hallucinated content discarded
- `test_faithfulness_score_in_result` -- score is always present and in valid range

## Test Results

All 13 tests pass:
- 7/7 response validator tests (2 existing + 5 new)
- 6/6 chat service tests (unchanged, no regressions)

## Commit

- `773cdec` fix: block invalid responses with disclaimer prefix and handle empty context
