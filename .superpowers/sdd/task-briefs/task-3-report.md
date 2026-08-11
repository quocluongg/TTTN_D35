# Task 3 Report: Improve Prompt Builder with Consultant Persona

## Status: DONE

## Changes Made

### `ai-system/generation/prompt_builder.py` — `_get_system_instructions()`

Rewrote the system instructions string from a short, restrictive 4-rule prompt into a structured consultant persona with 5 clearly labeled sections:

1. **VAI TRO (Role)**: "Chuyen vien tu van AI cao cap cua ShopWise" — positions the AI as a knowledgeable tech consultant and trusted companion.

2. **PHONG CACH TRA LOI (Response Style)**: Detailed, friendly, professional tone; uses "em" for self-reference and "quy khach"/"anh chi" for customers; emoji usage for warmth.

3. **KY THUAT TU VAN (Consultation Techniques)**: Proactive questioning about budget and use case; balanced pros/cons analysis; value-for-money comparison; suggesting 2-3 alternatives from CONTEXT.

4. **DINH DANG TRA LOI (Response Format)**: Markdown with headers, bullet points, bold for prices/specs; structured tables for comparisons; always end with a follow-up question to maintain dialogue.

5. **QUY TAC CHINH XAC (Accuracy Rules)**: Preserved all existing anti-hallucination rules — only use CONTEXT data, admit when info is missing, respond in Vietnamese.

### `ai-system/tests/test_prompt_builder.py`

Updated 2 assertions to match new prompt phrasing:
- `"Chuyen vien tu van AI"` → `"Chuyen vien tu van AI cao cap"`
- `"Quy tac bat buoc"` → `"QUY TAC CHINH XAC"`

## Test Results

All 3 existing tests pass:
- `test_build_prompt_returns_structured_dict` — PASSED
- `test_build_prompt_empty_docs` — PASSED
- `test_build_prompt_combined_backward_compatible` — PASSED

## Commit

- `a8b3b5d` — feat: rewrite system_instructions with consultant persona and response guidelines

## Concerns

None. The change is isolated to the `_get_system_instructions()` return string. No functional logic was altered. The `build_prompt()` and `build_prompt_combined()` interfaces remain unchanged.
