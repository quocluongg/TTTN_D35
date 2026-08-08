import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from api.main import app
from api.middleware import verify_api_key


client = TestClient(app)


@pytest.fixture
def mock_services():
    """Mock task_manager and override verify_api_key dependency."""
    # Override FastAPI dependency for auth
    async def override_verify_api_key():
        return "test-key"

    app.dependency_overrides[verify_api_key] = override_verify_api_key

    with patch("api.routers.sync.get_task_manager") as mock_tm:
        task_manager = MagicMock()
        task_manager.create_task.return_value = "task-test-123"
        task_manager.get_task.return_value = {
            "task_id": "task-test-123",
            "product_id": "prod-123",
            "status": "completed",
            "chunks_created": 4,
            "duration_ms": 2340,
            "error": None,
        }
        mock_tm.return_value = task_manager

        yield {
            "task_manager": task_manager,
        }

    # Clean up dependency overrides
    app.dependency_overrides.clear()


def test_sync_product_returns_202(mock_services):
    response = client.post(
        "/sync/product/prod-123",
        headers={"X-API-Key": "test-key"}
    )

    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "accepted"
    assert data["task_id"] == "task-test-123"


def test_sync_product_without_api_key_returns_401():
    """Test that missing API key returns 401 without any dependency override."""
    response = client.post("/sync/product/prod-123")
    assert response.status_code == 401


def test_get_task_status_returns_200(mock_services):
    response = client.get("/sync/status/task-test-123")

    assert response.status_code == 200
    data = response.json()
    assert data["task_id"] == "task-test-123"
    assert data["status"] == "completed"
    assert data["chunks_created"] == 4


def test_get_task_status_not_found():
    with patch("api.routers.sync.get_task_manager") as mock_tm:
        mock_tm.return_value.get_task.return_value = None

        response = client.get("/sync/status/nonexistent")

        assert response.status_code == 404
