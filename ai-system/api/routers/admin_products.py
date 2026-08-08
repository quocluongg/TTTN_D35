import uuid

from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession

from db.database import get_db_session
from services.product_service import ProductService
from api.schemas import (
    ProductCreateRequest, ProductUpdateRequest,
    ProductResponse, ProductStatusResponse,
)

router = APIRouter(prefix="/admin/products", tags=["admin-products"])


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    payload: ProductCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """
    IPO Model:
    - Input:
        - payload: Thông tin sản phẩm mới (ProductCreateRequest)
        - session: SQLAlchemy AsyncSession kết nối DB
    - Process:
        Step 1: Khởi tạo ProductService với session DB
        Step 2: Gọi service.create_product tạo mới sản phẩm và đẩy job index bất đồng bộ
        Step 3: Đóng gói phản hồi ProductResponse với status="processing"
    - Output: ProductResponse (id, status, message)
    """
    # Step 1: Khởi tạo Service
    service = ProductService(session)

    # Step 2: Tạo sản phẩm trong DB và khởi tạo background indexing
    product_id = await service.create_product(payload)

    # Step 3: Trả về trạng thái xử lý cho Admin
    return ProductResponse(
        id=product_id,
        status="processing",
        message="Sản phẩm đã được lưu, đang xử lý index để chatbot có thể sử dụng.",
    )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """
    IPO Model:
    - Input:
        - product_id: UUID của sản phẩm cần cập nhật
        - payload: Thông tin chỉnh sửa (ProductUpdateRequest)
        - session: DB AsyncSession
    - Process:
        Step 1: Khởi tạo ProductService
        Step 2: Thực hiện cập nhật dữ liệu sản phẩm và yêu cầu re-index
        Step 3: Bắt lỗi ValueError nếu không tìm thấy product_id và trả về 404
        Step 4: Đóng gói phản hồi status="processing"
    - Output: ProductResponse
    """
    # Step 1: Khởi tạo ProductService
    service = ProductService(session)

    # Step 2: Tiến hành cập nhật sản phẩm
    try:
        await service.update_product(product_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Step 3: Phản hồi kết quả cho client
    return ProductResponse(
        id=product_id,
        status="processing",
        message="Sản phẩm đã được cập nhật, đang re-index lại.",
    )


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
):
    """
    IPO Model:
    - Input:
        - product_id: UUID của sản phẩm cần xóa
        - session: DB AsyncSession
    - Process:
        Step 1: Khởi tạo ProductService
        Step 2: Xóa sản phẩm khỏi DB và hủy bỏ index trong ChromaDB & BM25
        Step 3: Bắt lỗi 404 nếu không tìm thấy
    - Output: None (HTTP 204 No Content)
    """
    # Step 1: Khởi tạo Service
    service = ProductService(session)

    # Step 2: Xóa sản phẩm và dữ liệu index liên quan
    try:
        await service.delete_product(product_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{product_id}/status", response_model=ProductStatusResponse)
async def get_product_status(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
):
    """
    IPO Model:
    - Input:
        - product_id: UUID của sản phẩm
        - session: DB AsyncSession
    - Process:
        Step 1: Khởi tạo ProductService
        Step 2: Tra cứu trạng thái status (processing/active/failed) của sản phẩm trong DB
        Step 3: Nếu không tìm thấy -> Ném ngoại lệ HTTPException 404
        Step 4: Trả về đối tượng ProductStatusResponse
    - Output: ProductStatusResponse (id, status)
    """
    # Step 1: Khởi tạo Service
    service = ProductService(session)

    # Step 2: Tra cứu trạng thái từ DB
    status = await service.get_product_status(product_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    # Step 3: Trả về kết quả status
    return ProductStatusResponse(id=product_id, status=status)

