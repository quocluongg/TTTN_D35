"""
SQLAlchemy ORM models - đây là "source of truth" của dữ liệu sản phẩm.
Vector DB / BM25 chỉ là index phục vụ tìm kiếm, build lại được từ đây bất cứ lúc nào.
"""
import uuid
from datetime import datetime

# pyrefly: ignore [missing-import]
from sqlalchemy import (
    String, Integer, Text, DateTime, ForeignKey, func
)
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import JSONB, UUID
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from config.constants import ProductStatus


class Base(DeclarativeBase):
    pass


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=True, index=True)
    price: Mapped[int] = mapped_column(Integer, nullable=False)

    specs: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    promotions: Mapped[str] = mapped_column(Text, nullable=True)
    warranty: Mapped[str] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ProductStatus.PROCESSING
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    faqs: Mapped[list["ProductFAQ"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )


class ProductFAQ(Base):
    __tablename__ = "product_faqs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="faqs")
