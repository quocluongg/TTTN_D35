"""Product management endpoints."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from ai.core.db import fetch_all_products, fetch_product_by_id

router = APIRouter(prefix="/admin/products", tags=["admin-products"])


@router.get("")
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
):
    products = fetch_all_products()
    if search:
        q = search.lower()
        products = [p for p in products if q in (p.get("name", "") or "").lower() or q in (p.get("brand", "") or "").lower()]
    if category:
        products = [p for p in products if (p.get("category", "") or "").lower() == category.lower()]

    total = len(products)
    start = (page - 1) * page_size
    items = [
        {"id": str(p.get("id", "")), "name": p.get("name", ""), "brand": p.get("brand", ""),
         "category": p.get("category", ""), "price": float(p.get("price", 0)),
         "rating": float(p.get("rating", 0)), "image_url": p.get("image_url", "")}
        for p in products[start:start + page_size]
    ]
    return {"total": total, "page": page, "page_size": page_size, "products": items}


@router.get("/{product_id}")
async def get_product(product_id: str):
    p = fetch_product_by_id(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": str(p.get("id", "")), "name": p.get("name", ""), "brand": p.get("brand", ""),
        "category": p.get("category", ""), "price": float(p.get("price", 0)),
        "description": p.get("description", ""), "image_url": p.get("image_url", ""),
        "specifications": p.get("specifications", {}),
    }


@router.get("/categories/list")
async def list_categories():
    products = fetch_all_products()
    return {"categories": sorted(set(p.get("category", "") for p in products if p.get("category")))}


@router.get("/brands/list")
async def list_brands():
    products = fetch_all_products()
    return {"brands": sorted(set(p.get("brand", "") for p in products if p.get("brand")))}
