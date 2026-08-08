"""
Integration tests for the RAG chatbot system.
These tests verify end-to-end behavior of the FastAPI application
using httpx AsyncClient with ASGITransport (no real server needed).
"""
import pytest
from httpx import AsyncClient, ASGITransport
from api.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """GET /health returns 200 with status ok."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_chat_endpoint_requires_query():
    """POST /chat with empty query returns 422 (Pydantic validation)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/chat", json={"query": ""})
        # min_length=1 on ChatRequest.query triggers 422 via Pydantic
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_endpoint_requires_query_body():
    """POST /chat without query field returns 422 (Pydantic validation)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/chat", json={})
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_sync_endpoint_requires_api_key():
    """POST /sync/product/{id} without API key returns 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/sync/product/test-123")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_stats_endpoint():
    """GET /admin/stats returns 200 with expected keys."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/admin/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_chunks_chromadb" in data
        assert "total_chunks_bm25" in data
