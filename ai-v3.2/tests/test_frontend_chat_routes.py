"""
Test frontend API route compatibility (/chat/conversations & /chat) in ai-v3.2 main app.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_frontend_create_and_list_conversations():
    # 1. Create conversation (POST /chat/conversations?user_id=mock-user-123)
    res_create = client.post("/chat/conversations?user_id=mock-user-123", json={"title": "Tư vấn Laptop Gaming"})
    assert res_create.status_code == 200
    data_create = res_create.json()
    assert "id" in data_create
    assert data_create["title"] == "Tư vấn Laptop Gaming"
    conv_id = data_create["id"]

    # 2. List conversations (GET /chat/conversations?user_id=mock-user-123)
    res_list = client.get("/chat/conversations?user_id=mock-user-123")
    assert res_list.status_code == 200
    data_list = res_list.json()
    assert isinstance(data_list, list)
    assert any(c["id"] == conv_id for c in data_list)

    # 3. Get conversation detail (GET /chat/conversations/{conv_id})
    res_detail = client.get(f"/chat/conversations/{conv_id}")
    assert res_detail.status_code == 200
    data_detail = res_detail.json()
    assert data_detail["id"] == conv_id
    assert "messages" in data_detail

    # 4. Delete conversation (DELETE /chat/conversations/{conv_id})
    res_del = client.delete(f"/chat/conversations/{conv_id}")
    assert res_del.status_code == 200
    assert res_del.json()["success"] is True


def test_frontend_post_chat():
    # POST /chat?conversation_id=...&user_id=mock-user-123 (json: {"query": "Tư vấn laptop 20 triệu"})
    res_chat = client.post("/chat?user_id=mock-user-123", json={"query": "Tư vấn laptop 20 triệu"})
    assert res_chat.status_code == 200
    data_chat = res_chat.json()
    assert "response" in data_chat
    assert "confidence" in data_chat
    assert "products" in data_chat
    assert "conversation_id" in data_chat


if __name__ == "__main__":
    test_frontend_create_and_list_conversations()
    test_frontend_post_chat()
    print("ALL FRONTEND COMPATIBILITY ROUTE TESTS PASSED 100%!")
