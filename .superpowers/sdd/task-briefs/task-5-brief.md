# Task 5: Fix Response Validator to Block Invalid Responses

## Problem
When validation fails (`is_valid = False`), the response validator logs a warning but sets `sanitized_response = response` (the original, potentially hallucinated response). The ChatService then returns this response to the user unchanged. Hallucinated content reaches the user silently.

## Requirements

### 5a. Add disclaimer when validation fails
In `ai-system/generation/response_validator.py`, when `is_valid` is False:
- Prepend a disclaimer to the response:
  `"⚠️ Lưu ý: Thông tin số liệu dưới đây có thể chưa chính xác, quý khách vui lòng xác nhận lại với cửa hàng.\n\n"`
- Keep the original response content (don't remove it, user still needs some answer)
- Log the validation failure with details

### 5b. Handle empty context case better
When `context_docs` is empty and the response doesn't contain refusal keywords:
- Set `is_valid = False`
- Return a standard "no information available" response instead of whatever the LLM generated

### 5c. Add faithfulness score to response metadata
The `ChatResponse` schema already has `validation_status` dict. Ensure the faithfulness_score is included so the frontend can optionally display it.

## Files to Modify
- `ai-system/generation/response_validator.py` (lines 106-119, the validation result logic)

## Acceptance Criteria
- When validation fails, response includes disclaimer prefix
- Empty context with non-refusal response returns standardized message
- Faithfulness score is in the validation_status output
- Original response content is preserved (just prefixed with disclaimer)
