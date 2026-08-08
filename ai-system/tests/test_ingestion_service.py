import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from services.ingestion_service import IngestionService
from services.task_manager import TaskStatus


@pytest.fixture
def mock_dependencies():
    return {
        "repo": AsyncMock(),
        "task_manager": MagicMock(),
        "encoder": MagicMock(),
        "indexer": MagicMock(),
    }


@pytest.mark.asyncio
async def test_ingest_product_success(mock_dependencies):
    service = IngestionService(**mock_dependencies)

    mock_dependencies["repo"].get_product_by_id.return_value = {
        "id": "test-123",
        "name": "Test Laptop",
        "brand": "ASUS",
        "price": 25000000,
        "description": "A test laptop",
        "specifications": {"CPU": "i7"},
        "warranty": "24 tháng",
        "category": "Laptop",
        "use_case": "Giải trí",
    }

    mock_dependencies["encoder"].encode_texts.return_value = [[0.1] * 1024] * 4

    await service.ingest_product("test-123", "task-abc")

    mock_dependencies["task_manager"].update_task.assert_any_call(
        "task-abc", status=TaskStatus.PROCESSING
    )
    mock_dependencies["task_manager"].update_task.assert_any_call(
        "task-abc", status=TaskStatus.COMPLETED, chunks_created=4, duration_ms=pytest.approx(0, abs=5000)
    )


@pytest.mark.asyncio
async def test_ingest_product_handles_missing_product(mock_dependencies):
    service = IngestionService(**mock_dependencies)

    mock_dependencies["repo"].get_product_by_id.return_value = None

    await service.ingest_product("nonexistent", "task-abc")

    mock_dependencies["task_manager"].update_task.assert_any_call(
        "task-abc", status=TaskStatus.FAILED, error="Product nonexistent not found", duration_ms=pytest.approx(0, abs=5000)
    )
