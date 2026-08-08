"""
Task Manager for tracking background ingestion tasks.
"""
import time
import uuid
import threading
from enum import StrEnum
from typing import Any


class TaskStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskManager:
    def __init__(self):
        self._tasks: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_task(self, product_id: str) -> str:
        """
        Create a new background task.

        Args:
            product_id: The product being processed

        Returns:
            str: Task ID (format: task_xxxxx)
        """
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        with self._lock:
            self._tasks[task_id] = {
                "task_id": task_id,
                "product_id": product_id,
                "status": TaskStatus.PENDING,
                "chunks_created": 0,
                "duration_ms": 0,
                "error": None,
                "created_at": time.time(),
            }
        return task_id

    def get_task(self, task_id: str) -> dict[str, Any] | None:
        """
        Get task info by task ID.

        Args:
            task_id: The task ID to look up

        Returns:
            dict with task info or None if not found
        """
        with self._lock:
            return self._tasks.get(task_id)

    def update_task(self, task_id: str, **kwargs) -> None:
        """
        Update task fields.

        Args:
            task_id: The task ID to update
            **kwargs: Fields to update (status, chunks_created, duration_ms, error)
        """
        with self._lock:
            if task_id not in self._tasks:
                return

            task = self._tasks[task_id]

            if "status" in kwargs:
                task["status"] = kwargs["status"]
            if "chunks_created" in kwargs:
                task["chunks_created"] = kwargs["chunks_created"]
            if "duration_ms" in kwargs:
                task["duration_ms"] = kwargs["duration_ms"]
            if "error" in kwargs:
                task["error"] = kwargs["error"]

            # Calculate duration if completing
            if kwargs.get("status") in (TaskStatus.COMPLETED, TaskStatus.FAILED):
                if task["duration_ms"] == 0:
                    task["duration_ms"] = int((time.time() - task["created_at"]) * 1000)


# Singleton instance
_task_manager = None


def get_task_manager() -> TaskManager:
    global _task_manager
    if _task_manager is None:
        _task_manager = TaskManager()
    return _task_manager
