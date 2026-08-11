# Task 6: Consolidate API Pipelines

## Problem
The project has TWO parallel FastAPI apps:
1. **Legacy** (`main.py`): Uses FAISS, simple score addition, no reranker. Frontend currently connects to this one.
2. **New** (`api/main.py`): Uses ChromaDB, RRF fusion, cross-encoder reranking, response validator. BUT has no conversation management.

The frontend calls `http://localhost:8001/chat` which goes to the legacy pipeline, bypassing all the sophisticated retrieval work.

## Requirements

### 6a. Make `api/main.py` the single entry point
- Copy conversation management routers from legacy `main.py` to `api/main.py`
- The conversation endpoints are in `routers/conversations.py` and `routers/chat.py` (legacy)
- Register them on the new `api/main.py` app

### 6b. Update legacy chat router to use new pipeline
The legacy `routers/chat.py` has conversation persistence (saving messages to DB). The new `api/routers/chat.py` does not.
- Add conversation_id and message saving to the new `api/routers/chat.py`
- Or: make the legacy chat router call the new ChatService instead of the old pipeline

### 6c. Ensure CORS and middleware are consistent
Both apps have CORS middleware. Consolidate settings.

### 6d. Update frontend API URL if needed
The frontend uses `NEXT_PUBLIC_AI_API_URL` env var (default `http://localhost:8001`). Make sure the new consolidated app listens on the same port.

## Files to Modify
- `ai-system/api/main.py` (add conversation routers)
- `ai-system/api/routers/chat.py` (add conversation persistence)
- Potentially `ai-system/main.py` (may become unused or redirect)

## Acceptance Criteria
- Single FastAPI app serves both chat and conversation endpoints
- Frontend can call `/chat` and `/chat/conversations/*` on the same app
- New pipeline (ChromaDB + RRF + reranker) is used for chat
- Conversation messages are persisted to database
- No duplicate route definitions
