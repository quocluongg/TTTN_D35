"""
Service layer: nơi duy nhất admin API gọi vào để tạo/sửa/xóa sản phẩm.
Đảm bảo transaction DB luôn commit xong mới enqueue job index - tránh việc
worker fetch phải sản phẩm chưa thực sự tồn tại (do transaction rollback).
"""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from db.product_repository import ProductRepository
from workers.ingestion_queue import IngestionQueue
from config.constants import SyncAction
from api.schemas import ProductCreateRequest, ProductUpdateRequest



class ProductService:
    def __init__(self, session: AsyncSession, ingestion_queue: IngestionQueue | None = None):
        self.repo = ProductRepository(session)
        self.ingestion_queue = ingestion_queue or IngestionQueue()

class ProductService:
    def __init__(self, session: AsyncSession, ingestion_queue: IngestionQueue | None = None):
        self.repo = ProductRepository(session)
        self.ingestion_queue = ingestion_queue or IngestionQueue()

    async def create_product(self, payload: ProductCreateRequest) -> uuid.UUID:
        """
        IPO Model:
        - Input: payload (ProductCreateRequest)
        - Process:
            Step 1: Trích xuất data sản phẩm và danh sách câu hỏi FAQ từ payload
            Step 2: Gọi repository.create để ghi sản phẩm vào cơ sở dữ liệu
            Step 3: Đẩy job 'sync_product_index' với action CREATE vào IngestionQueue
        - Output: UUID của sản phẩm mới được tạo
        """
        # Step 1: Chuẩn bị dữ liệu từ schema payload
        data = payload.model_dump(exclude={"faqs"})
        faqs = [f.model_dump() for f in payload.faqs]

        # Step 2: Lưu thông tin sản phẩm và FAQ vào DB
        product = await self.repo.create(data, faqs)

        # Step 3: Đẩy job đồng bộ vector index vào hàng đợi
        await self.ingestion_queue.enqueue(
            "sync_product_index", product_id=str(product.id), action=SyncAction.CREATE
        )
        return product.id

    async def update_product(self, product_id: uuid.UUID, payload: ProductUpdateRequest) -> None:
        """
        IPO Model:
        - Input:
            - product_id: UUID của sản phẩm
            - payload: ProductUpdateRequest
        - Process:
            Step 1: Trích xuất dữ liệu cập nhật từ payload
            Step 2: Tra cứu sản phẩm hiện có trong DB (ném ValueError nếu không tồn tại)
            Step 3: Gọi repository.update cập nhật thông tin trong DB
            Step 4: Đẩy job 'sync_product_index' với action UPDATE vào IngestionQueue
        - Output: None
        """
        # Step 1: Lấy các trường dữ liệu cần chỉnh sửa
        data = payload.model_dump(exclude={"faqs"}, exclude_unset=True)
        faqs = [f.model_dump() for f in payload.faqs] if payload.faqs is not None else None

        # Step 2: Kiểm tra sự tồn tại của sản phẩm
        existing = await self.repo.get_by_id(product_id)
        if existing is None:
            raise ValueError(f"Sản phẩm {product_id} không tồn tại")

        # Step 3: Cập nhật trong DB
        await self.repo.update(product_id, data, faqs)

        # Step 4: Đẩy job re-index vào hàng đợi
        await self.ingestion_queue.enqueue(
            "sync_product_index", product_id=str(product_id), action=SyncAction.UPDATE
        )

    async def delete_product(self, product_id: uuid.UUID) -> None:
        """
        IPO Model:
        - Input: product_id (UUID của sản phẩm cần xóa)
        - Process:
            Step 1: Kiểm tra sự tồn tại của sản phẩm (ném ValueError nếu không tìm thấy)
            Step 2: Gọi repository.delete xóa bản ghi trong DB
            Step 3: Đẩy job 'sync_product_index' với action DELETE để gỡ bỏ vector index
        - Output: None
        """
        # Step 1: Kiểm tra sản phẩm có tồn tại hay không
        existing = await self.repo.get_by_id(product_id)
        if existing is None:
            raise ValueError(f"Sản phẩm {product_id} không tồn tại")

        # Step 2: Thực hiện xóa dữ liệu khỏi DB
        await self.repo.delete(product_id)

        # Step 3: Đẩy job xóa khỏi chỉ mục ChromaDB & BM25
        await self.ingestion_queue.enqueue(
            "sync_product_index", product_id=str(product_id), action=SyncAction.DELETE
        )

    async def get_product_status(self, product_id: uuid.UUID) -> str | None:
        """
        IPO Model:
        - Input: product_id (UUID của sản phẩm)
        - Process: Tra cứu sản phẩm trong DB và lấy giá trị trường status
        - Output: Chuỗi trạng thái (processing/active/failed) hoặc None
        """
        # Step 1: Tra cứu bản ghi sản phẩm trong DB
        product = await self.repo.get_by_id(product_id)
        # Step 2: Trả về trạng thái status
        return product.status if product else None

