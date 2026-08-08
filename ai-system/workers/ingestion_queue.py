"""
Wrapper mỏng quanh việc enqueue Celery task - tách riêng để service layer
không phụ thuộc trực tiếp vào Celery (dễ mock khi viết unit test).
"""
from workers.sync_product_index import sync_product_index



class IngestionQueue:
    async def enqueue(self, task_name: str, **kwargs) -> str:
        """
        task_name hiện chỉ hỗ trợ "sync_product_index".
        Trả về Celery task id để có thể tra cứu trạng thái job nếu cần.
        """
        if task_name != "sync_product_index":
            raise ValueError(f"Task không được hỗ trợ: {task_name}")

        async_result = sync_product_index.delay(
            product_id=kwargs["product_id"], action=kwargs["action"]
        )
        return async_result.id
