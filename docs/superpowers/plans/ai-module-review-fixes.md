# AI Module Review Fixes Plan

## Overview
Fix critical issues found in the AI module code review. The main problems:
1. Frontend connects to legacy pipeline, bypassing the new sophisticated pipeline
2. Product recommendations are disconnected from RAG reranking results
3. LLM client doesn't separate system/user messages
4. Prompt is too restrictive, lacks consultant persona
5. Intent label mismatch between fallback classifier and constants
6. Response validator doesn't block invalid responses

## Global Constraints
- All changes must be in `ai-system/` directory (Python backend) or `frontend/app/ai/` (React frontend)
- Maintain backward compatibility with existing API schemas
- Don't break the conversation management feature
- Follow existing code patterns (IPO model comments, Vietnamese docstrings)
- Temperature default: 0.5 (balanced between creative and factual)
- Faithfulness threshold: 0.5 (production-ready)

## Tasks

### Task 1: Fix Intent Label Mismatch
**Files:** `ai-system/nlu/intent_classifier.py`
**Problem:** Fallback returns `"price_query"`, `"comparison_query"`, `"spec_query"` but constants use `"ask_price"`, `"compare_products"`, `"ask_specs"`
**Fix:** Align fallback labels with `config/constants.py` INTENT_LABELS

### Task 2: Add System/User Message Separation for LLM Client
**Files:** `ai-system/generation/llm_client.py`, `ai-system/generation/prompt_builder.py`
**Problem:** Both Gemini and OpenAI clients send entire prompt as single user message
**Fix:**
- Modify `prompt_builder.py` to return system_instructions and user_content separately
- Modify `llm_client.py` to use system role for both providers
- Gemini: use `system_instruction` parameter in GenerativeModel
- OpenAI: use `{"role": "system"}` message

### Task 3: Improve Prompt Builder with Consultant Persona
**Files:** `ai-system/generation/prompt_builder.py`
**Problem:** Prompt is too restrictive, no guidance on HOW to respond as consultant
**Fix:** Add detailed consultant persona instructions: ask about budget, provide pros/cons, suggest alternatives, use warm language

### Task 4: Increase Temperature and Fix Faithfulness Threshold
**Files:** `ai-system/config/settings.py`, `ai-system/generation/response_validator.py`
**Problem:** Temperature 0.2 is too low, faithfulness threshold 0.3 allows 70% hallucination
**Fix:**
- Temperature: 0.2 -> 0.5
- Faithfulness threshold: 0.3 -> 0.5

### Task 5: Fix Response Validator to Block Invalid Responses
**Files:** `ai-system/generation/response_validator.py`
**Problem:** When validation fails, hallucinated response is passed through to user
**Fix:** Add disclaimer prefix when validation fails, don't silently pass hallucinated content

### Task 6: Consolidate API Pipelines
**Files:** `ai-system/main.py`, `ai-system/api/main.py`, `ai-system/routers/chat.py`
**Problem:** Frontend connects to legacy pipeline (FAISS, no reranker), new pipeline (ChromaDB, RRF, reranker) is unused
**Fix:** Merge conversation management from legacy into new pipeline, make `api/main.py` the single entry point

### Task 7: Fix Product Recommendation Flow
**Files:** `frontend/app/ai/page.tsx`
**Problem:** Product cards use separate search instead of reranked RAG results; `parseProductFromSource` returns hardcoded fake data
**Fix:**
- Extract product IDs from top reranked source chunks
- Fetch real products from backend using those IDs
- Remove `parseProductFromSource` hardcoded data
- Show loading state while fetching
