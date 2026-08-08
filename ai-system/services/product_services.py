"""
Service layer: nơi duy nhất admin API gọi vào để tạo/sửa/xóa sản phẩm.
Đảm bảo transaction DB luôn commit xong mới enqueue job index - tránh việc
worker fetch phải sản phẩm chưa thực sự tồn tại (do transaction rollback).
"""
import uuid

# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession

# pyrefly: ignore [missing-import]
from db.product_repository import ProductRepository
# pyrefly: ignore [missing-import]
from workers.ingestion_queue import IngestionQueue
# pyrefly: ignore [missing-import]
from config.constants import SyncAction
# pyrefly: ignore [missing-import]
from api.schemas import ProductCreateRequest, ProductUpdateRequest



class ProductService:
    def __init__(self, session: AsyncSession, ingestion_queue: IngestionQueue | None = None):
        self.repo = ProductRepository(session)
        self.ingestion_queue = ingestion_queue or IngestionQueue()

    async def create_product(self, payload: ProductCreateRequest) -> uuid.UUID:
        data = payload.model_dump(exclude={"faqs"})
        faqs = [f.model_dump() for f in payload.faqs]

        product = await self.repo.create(data, faqs)

        await self.ingestion_queue.enqueue(
            "sync_product_index", product_id=str(product.id), action=SyncAction.CREATE
        )
        return product.id

    async def update_product(self, product_id: uuid.UUID, payload: ProductUpdateRequest) -> None:
        data = payload.model_dump(exclude={"faqs"}, exclude_unset=True)
        faqs = [f.model_dump() for f in payload.faqs] if payload.faqs is not None else None

        existing = await self.repo.get_by_id(product_id)
        if existing is None:
            raise ValueError(f"Sản phẩm {product_id} không tồn tại")

        await self.repo.update(product_id, data, faqs)

        await self.ingestion_queue.enqueue(
            "sync_product_index", product_id=str(product_id), action=SyncAction.UPDATE
        )

    async def delete_product(self, product_id: uuid.UUID) -> None:
        existing = await self.repo.get_by_id(product_id)
        if existing is None:
            raise ValueError(f"Sản phẩm {product_id} không tồn tại")

        await self.repo.delete(product_id)

        await self.ingestion_queue.enqueue(
            "sync_product_index", product_id=str(product_id), action=SyncAction.DELETE
        )

    async def get_product_status(self, product_id: uuid.UUID) -> str | None:
        product = await self.repo.get_by_id(product_id)
        return product.status if product else None
