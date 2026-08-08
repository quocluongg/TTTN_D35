"""
Repository layer: tách biệt logic truy vấn DB khỏi business logic (service layer).
Worker và API đều dùng chung repository này để đảm bảo nhất quán.
"""
import uuid

from sqlalchemy import select, update as sa_update, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models import Product, ProductFAQ
from config.constants import ProductStatus



class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, product_id: uuid.UUID) -> Product | None:
        """
        IPO Model:
        - Input: product_id (UUID của sản phẩm)
        - Process:
            Step 1: Khởi tạo SQLAlchemy SELECT query kèm selectinload nạp quan hệ faqs
            Step 2: Thực thi query trên AsyncSession
            Step 3: Trả về instance Product hoặc None nếu không tồn tại
        - Output: Product instance hoặc None
        """
        # Step 1: Tạo câu lệnh truy vấn sản phẩm kèm danh sách câu hỏi FAQ liên quan
        stmt = (
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.faqs))
        )
        # Step 2: Thực thi query
        result = await self.session.execute(stmt)
        # Step 3: Trả về kết quả
        return result.scalar_one_or_none()

    async def get_product_by_id(self, product_id: str) -> dict | None:
        """
        Fetch a single product by ID with its category and specifications.

        Args:
            product_id: UUID string of the product

        Returns:
            dict with product data or None if not found
        """
        from sqlalchemy import text

        query = """
            SELECT
                p.id,
                p.name,
                p.slug,
                p.description,
                p.brand,
                p.thumbnail as image_url,
                COALESCE(p.rating_avg, 5.0) as rating,
                COALESCE(p.review_count, 0) as reviews_count,
                COALESCE(p.sold_quantity, 0) as sold_quantity,
                COALESCE(p.use_case, 'Giải trí') as use_case,
                COALESCE(p.is_active, true) as is_active,
                COALESCE(c.name, 'Laptop') as category,
                COALESCE(v.price, 0) as price,
                COALESCE(v.stock, 20) as stock_quantity,
                v.attributes as specifications
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_variants v ON v.product_id = p.id
            WHERE p.id = :product_id AND p.is_active IS NOT FALSE
        """

        result = await self.session.execute(
            text(query),
            {"product_id": product_id}
        )
        row = result.fetchone()

        if row is None:
            return None

        # Convert to dict
        product = dict(row)

        # Normalize data types
        import json
        product['price'] = float(product['price']) if product['price'] is not None else 0.0
        product['rating'] = float(product['rating']) if product['rating'] is not None else 4.8
        product['reviews_count'] = int(product['reviews_count']) if product['reviews_count'] is not None else 20
        product['sold_quantity'] = int(product['sold_quantity']) if product['sold_quantity'] is not None else 0

        # Parse specifications if string
        if isinstance(product.get('specifications'), str):
            try:
                product['specifications'] = json.loads(product['specifications'])
            except Exception:
                product['specifications'] = {}
        elif not product.get('specifications'):
            product['specifications'] = {}

        return product

    async def create(self, data: dict, faqs: list[dict]) -> Product:
        """
        IPO Model:
        - Input:
            - data: Dict chứa thông tin sản phẩm (name, brand, price, specs,...)
            - faqs: List[dict] chứa danh sách câu hỏi FAQ kèm câu trả lời
        - Process:
            Step 1: Khởi tạo đối tượng Product với status="processing"
            Step 2: Thêm vào session và flush() để sinh product.id
            Step 3: Thêm các đối tượng ProductFAQ liên quan
            Step 4: Commit transaction và refresh đối tượng product
        - Output: Product instance vừa tạo
        """
        # Step 1: Khởi tạo bản ghi Product
        product = Product(**data, status=ProductStatus.PROCESSING)
        self.session.add(product)
        # Step 2: Flush để lấy product.id tự sinh
        await self.session.flush()

        # Step 3: Thêm các câu hỏi FAQ liên kết
        for faq in faqs:
            self.session.add(
                ProductFAQ(product_id=product.id, question=faq["question"], answer=faq["answer"])
            )

        # Step 4: Lưu thay đổi và refresh dữ liệu
        await self.session.commit()
        await self.session.refresh(product)
        return product

    async def update(self, product_id: uuid.UUID, data: dict, faqs: list[dict] | None = None) -> None:
        """
        IPO Model:
        - Input:
            - product_id: UUID của sản phẩm cần sửa
            - data: Dict chứa các trường thông tin cập nhật
            - faqs: List[dict] danh sách FAQ mới (tùy chọn)
        - Process:
            Step 1: Đổi trạng thái status thành "processing"
            Step 2: Thực thi sa_update cập nhật thông tin sản phẩm trong DB
            Step 3: Nếu faqs không None -> Xóa toàn bộ FAQ cũ của product_id và thêm lại các FAQ mới
            Step 4: Commit transaction
        - Output: None
        """
        # Step 1: Đánh dấu trạng thái processing cho công việc re-index
        data["status"] = ProductStatus.PROCESSING
        await self.session.execute(
            sa_update(Product).where(Product.id == product_id).values(**data)
        )

        # Step 2: Cập nhật danh sách câu hỏi FAQ nếu được cung cấp
        if faqs is not None:
            await self.session.execute(
                sa_delete(ProductFAQ).where(ProductFAQ.product_id == product_id)
            )
            for faq in faqs:
                self.session.add(
                    ProductFAQ(product_id=product_id, question=faq["question"], answer=faq["answer"])
                )

        # Step 3: Commit transaction
        await self.session.commit()

    async def delete(self, product_id: uuid.UUID) -> None:
        """
        IPO Model:
        - Input: product_id (UUID sản phẩm)
        - Process:
            Step 1: Thực thi sa_delete xóa sản phẩm khỏi bảng products (cascade xóa faqs)
            Step 2: Commit transaction
        - Output: None
        """
        # Step 1: Xóa sản phẩm khỏi CSDL
        await self.session.execute(
            sa_delete(Product).where(Product.id == product_id)
        )
        # Step 2: Commit thay đổi
        await self.session.commit()

    async def set_status(self, product_id: uuid.UUID, status: ProductStatus) -> None:
        """
        IPO Model:
        - Input:
            - product_id: UUID của sản phẩm
            - status: ProductStatus enum (PROCESSING, ACTIVE, FAILED)
        - Process:
            Step 1: Cập nhật trường status của sản phẩm
            Step 2: Commit transaction
        - Output: None
        """
        # Step 1: Cập nhật cột status
        await self.session.execute(
            sa_update(Product).where(Product.id == product_id).values(status=status)
        )
        # Step 2: Commit transaction
        await self.session.commit()

