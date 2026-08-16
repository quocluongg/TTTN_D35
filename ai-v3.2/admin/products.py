"""Product management endpoints."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException, Query
from db.supabase_client import fetch_all_products, fetch_product_by_id

router = APIRouter(prefix="/admin/products", tags=["admin-products"])


@router.get("")
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None, description="Search by name or brand"),
    category: str = Query(None, description="Filter by category"),
):
    """List all products with pagination and filters."""
    products = fetch_all_products()

    # Apply filters
    if search:
        search_lower = search.lower()
        products = [
            p for p in products
            if search_lower in (p.get("name", "") or "").lower()
            or search_lower in (p.get("brand", "") or "").lower()
        ]

    if category:
        products = [
            p for p in products
            if (p.get("category", "") or "").lower() == category.lower()
        ]

    total = len(products)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = products[start:end]

    # Clean up for response
    items = []
    for p in paginated:
        items.append({
            "id": str(p.get("id", "")),
            "name": p.get("name", ""),
            "brand": p.get("brand", ""),
            "category": p.get("category", ""),
            "price": float(p.get("price", 0)),
            "rating": float(p.get("rating", 0)),
            "image_url": p.get("image_url", ""),
            "is_active": p.get("is_active", True),
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "products": items,
    }


@router.get("/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID."""
    product = fetch_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": str(product.get("id", "")),
        "name": product.get("name", ""),
        "brand": product.get("brand", ""),
        "category": product.get("category", ""),
        "price": float(product.get("price", 0)),
        "rating": float(product.get("rating", 0)),
        "description": product.get("description", ""),
        "image_url": product.get("image_url", ""),
        "use_case": product.get("use_case", ""),
        "specifications": product.get("specifications", {}),
    }


@router.get("/categories/list")
async def list_categories():
    """Get distinct product categories."""
    products = fetch_all_products()
    categories = sorted(set(
        p.get("category", "Unknown") for p in products if p.get("category")
    ))
    return {"categories": categories}


@router.get("/brands/list")
async def list_brands():
    """Get distinct product brands."""
    products = fetch_all_products()
    brands = sorted(set(
        p.get("brand", "Unknown") for p in products if p.get("brand")
    ))
    return {"brands": brands}
