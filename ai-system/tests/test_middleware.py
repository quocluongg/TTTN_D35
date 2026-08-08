import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from api.middleware import verify_api_key


app = FastAPI()


@app.get("/protected", dependencies=[Depends(verify_api_key)])
async def protected_route():
    return {"status": "ok"}


client = TestClient(app)


def test_missing_api_key_returns_401():
    response = client.get("/protected")
    assert response.status_code == 401
    assert "API key missing" in response.json()["detail"]


def test_invalid_api_key_returns_401():
    response = client.get("/protected", headers={"X-API-Key": "wrong-key"})
    assert response.status_code == 401
    assert "Invalid API key" in response.json()["detail"]


def test_valid_api_key_returns_200(monkeypatch):
    monkeypatch.setenv("RAG_SYNC_API_KEY", "test-secret-key")
    # Patch the already-instantiated settings object (get_settings uses lru_cache)
    import api.middleware as mw
    monkeypatch.setattr(mw.settings, "RAG_SYNC_API_KEY", "test-secret-key")
    response = client.get("/protected", headers={"X-API-Key": "test-secret-key"})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
