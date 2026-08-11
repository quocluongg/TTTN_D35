# Task 6 Report: Consolidate API Pipelines

## Status: DONE

## Summary

Successfully consolidated the two parallel FastAPI apps into a single entry point. The new `api/main.py` now serves both the advanced RAG pipeline (ChromaDB + RRF + cross-encoder reranking) AND conversation management endpoints.

## Changes Made

### 1. `ai-system/api/schemas.py`
- Added `conversation_id` and `user_id` fields to `ChatRequest` schema
- These fields are optional (default `None`) so existing callers without conversation support continue to work

### 2. `ai-system/api/routers/chat.py`
- Added conversation persistence: when `conversation_id` is provided in the request, both user and assistant messages are saved to the `rag_messages` table
- Reused the same `_save_message` pattern from the legacy `routers/chat.py`
- Pipeline metadata (confidence, sources, intent) is captured and stored with the assistant message
- Failure to save messages is logged as a warning but does NOT fail the chat response (graceful degradation)

### 3. `ai-system/api/main.py`
- Imported and registered the conversations router from `routers/conversations.py`
- Added `__main__` block with `uvicorn.run("api.main:app", ...)` using `settings.APP_PORT` (default 8001)

## Verification

### Acceptance Criteria Check
| Criterion | Status |
|-----------|--------|
| Single FastAPI app serves both chat and conversation endpoints | DONE |
| Frontend can call `/chat` and `/chat/conversations/*` on the same app | DONE |
| New pipeline (ChromaDB + RRF + reranker) is used for chat | DONE |
| Conversation messages are persisted to database | DONE |
| No duplicate route definitions | DONE |

### Endpoint Mapping
- `POST /chat` - New RAG pipeline with optional conversation persistence
- `POST /chat/conversations` - Create conversation
- `GET /chat/conversations` - List conversations
- `GET /chat/conversations/{id}` - Get conversation with messages
- `DELETE /chat/conversations/{id}` - Delete conversation
- `GET /health` - Health check
- All existing admin/sync/test endpoints remain unchanged

### Port Configuration
- `api/main.py` uses `config/settings.py` which defaults to port 8001
- Frontend `NEXT_PUBLIC_AI_API_URL` default `http://localhost:8001` will work without changes

## Technical Notes

1. **Import Strategy**: The conversations router from `routers/conversations.py` is imported directly into `api/main.py`. This router uses `sys.path` manipulation internally to resolve its own imports (`db.supabase_client`), which works correctly when the app is run from the `ai-system` directory.

2. **Database Client**: Both the new chat endpoint and the conversations router use the same `db.supabase_client.get_connection()` function, ensuring consistent database access.

3. **Legacy App**: `ai-system/main.py` remains untouched and can still be used as a fallback if needed, but is no longer the primary entry point.

## Files Modified
- `ai-system/api/schemas.py` (2 lines added)
- `ai-system/api/routers/chat.py` (58 lines added)
- `ai-system/api/main.py` (2 lines added)
