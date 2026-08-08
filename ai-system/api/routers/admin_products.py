import uuid

from fastapi import APIRouter, Depends, HTTPException
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
    Tạo sản phẩm mới. Trả về ngay status='processing' - sản phẩm chưa thể
    được chatbot trả lời cho tới khi worker index xong (poll /status để kiểm tra).
    """
    service = ProductService(session)
    product_id = await service.create_product(payload)
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
    service = ProductService(session)
    try:
        await service.update_product(product_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

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
    service = ProductService(session)
    try:
        await service.delete_product(product_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{product_id}/status", response_model=ProductStatusResponse)
async def get_product_status(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_db_session),
):
    """Admin UI dùng endpoint này để poll trạng thái index (processing/active/failed)."""
    service = ProductService(session)
    status = await service.get_product_status(product_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")
    return ProductStatusResponse(id=product_id, status=status)
