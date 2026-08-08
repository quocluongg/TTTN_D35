import pytest
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.task_manager import TaskManager, TaskStatus


@pytest.fixture
def manager():
    return TaskManager()


def test_create_task_returns_task_id(manager):
    task_id = manager.create_task(product_id="test-product-123")
    assert task_id is not None
    assert task_id.startswith("task_")


def test_get_task_returns_task_info(manager):
    task_id = manager.create_task(product_id="test-product-123")
    task = manager.get_task(task_id)

    assert task is not None
    assert task["product_id"] == "test-product-123"
    assert task["status"] == TaskStatus.PENDING


def test_update_task_status(manager):
    task_id = manager.create_task(product_id="test-product-123")
    manager.update_task(task_id, status=TaskStatus.PROCESSING)

    task = manager.get_task(task_id)
    assert task["status"] == TaskStatus.PROCESSING


def test_update_task_completed(manager):
    task_id = manager.create_task(product_id="test-product-123")
    manager.update_task(
        task_id,
        status=TaskStatus.COMPLETED,
        chunks_created=4,
        duration_ms=2340
    )

    task = manager.get_task(task_id)
    assert task["status"] == TaskStatus.COMPLETED
    assert task["chunks_created"] == 4
    assert task["duration_ms"] == 2340


def test_update_task_failed(manager):
    task_id = manager.create_task(product_id="test-product-123")
    manager.update_task(
        task_id,
        status=TaskStatus.FAILED,
        error="Embedding failed"
    )

    task = manager.get_task(task_id)
    assert task["status"] == TaskStatus.FAILED
    assert task["error"] == "Embedding failed"


def test_get_nonexistent_task_returns_none(manager):
    task = manager.get_task("nonexistent-task")
    assert task is None
