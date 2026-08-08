"""
Repository layer: tách biệt logic truy vấn DB khỏi business logic (service layer).
Worker và API đều dùng chung repository này để đảm bảo nhất quán.
"""
import uuid

# pyrefly: ignore [missing-import]
from sqlalchemy import select, update as sa_update, delete as sa_delete
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import selectinload

# pyrefly: ignore [missing-import]
from db.models import Product, ProductFAQ
# pyrefly: ignore [missing-import]
from config.constants import ProductStatus



class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, product_id: uuid.UUID) -> Product | None:
        stmt = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.faqs))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, data: dict, faqs: list[dict]) -> Product:
        product = Product(**data, status=ProductStatus.PROCESSING)
        self.session.add(product)
        await self.session.flush()  # để có product.id trước khi tạo FAQ

        for faq in faqs:
            self.session.add(
                ProductFAQ(product_id=product.id, question=faq["question"], answer=faq["answer"])
            )

        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def update(self, product_id: uuid.UUID, data: dict, faqs: list[dict] | None = None) -> None:
        data["status"] = ProductStatus.PROCESSING
        await self.session.execute(
            sa_update(Product).where(Product.id == product_id).values(**data)
        )

        if faqs is not None:
            # đơn giản hoá: xoá hết FAQ cũ, insert lại FAQ mới
            await self.session.execute(
                sa_delete(ProductFAQ).where(ProductFAQ.product_id == product_id)
            )
            for faq in faqs:
                self.session.add(
                    ProductFAQ(product_id=product_id, question=faq["question"], answer=faq["answer"])
                )

        await self.session.commit()

    async def delete(self, product_id: uuid.UUID) -> None:
        await self.session.execute(
            sa_delete(Product).where(Product.id == product_id)
        )
        await self.session.commit()

    async def set_status(self, product_id: uuid.UUID, status: ProductStatus) -> None:
        await self.session.execute(
            sa_update(Product).where(Product.id == product_id).values(status=status)
        )
        await self.session.commit()
