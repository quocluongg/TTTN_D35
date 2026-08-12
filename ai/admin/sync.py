"""Sync management endpoints."""
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai.core.db import (
    delete_chunks_by_product,
    fetch_all_products,
    fetch_product_by_id,
    get_all_chunk_ids_by_product,
    save_chunks,
)
from ai.admin.logs import log_sync

router = APIRouter(prefix="/admin/sync", tags=["admin-sync"])


class BatchSyncRequest(BaseModel):
    product_ids: list[str]


def _sync_one(product_id: str) -> dict:
    product = fetch_product_by_id(product_id)
    if not product:
        return {"product_id": product_id, "status": "not_found"}
    start = time.time()
    try:
        from ai.core.embeddings import PGVectorSearcher
        searcher = PGVectorSearcher([product])
        delete_chunks_by_product(product_id)

        name = product.get("name", "")
        chunk_text = f"Sản phẩm: {name}. Danh mục: {product.get('category', '')}. Mô tả: {product.get('description', '')}"
        embedding = searcher.encode_query(chunk_text)

        save_chunks([{
            "id": f"{product_id}_product", "product_id": product_id, "chunk_type": "product",
            "text": chunk_text, "embedding": embedding,
            "metadata": {"product_name": name, "category": product.get("category", ""), "price": product.get("price", 0)},
        }])
        ms = int((time.time() - start) * 1000)
        log_sync(product_id, name, "sync", 1, "success", ms)
        return {"product_id": product_id, "product_name": name, "status": "synced", "chunks": 1, "duration_ms": ms}
    except Exception as e:
        return {"product_id": product_id, "status": "error", "error": str(e)}


@router.get("/status")
async def get_sync_status():
    all_products = fetch_all_products()
    mapping = get_all_chunk_ids_by_product()
    synced, not_synced = [], []
    for p in all_products:
        pid = str(p.get("id", ""))
        info = {"id": pid, "name": p.get("name", ""), "brand": p.get("brand", ""), "price": float(p.get("price", 0))}
        if pid in mapping:
            info["chunk_count"] = len(mapping[pid])
            info["status"] = "synced"
            synced.append(info)
        else:
            info["chunk_count"] = 0
            info["status"] = "not_synced"
            not_synced.append(info)
    return {
        "total_products": len(all_products), "synced_count": len(synced),
        "not_synced_count": len(not_synced),
        "sync_percentage": round(len(synced) / len(all_products) * 100, 1) if all_products else 0,
    }


@router.post("/product/{product_id}")
async def sync_single(product_id: str):
    result = _sync_one(product_id)
    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return result


@router.post("/batch")
async def sync_batch(request: BatchSyncRequest):
    results = [_sync_one(pid) for pid in request.product_ids]
    return {
        "total_requested": len(request.product_ids),
        "total_synced": sum(1 for r in results if r["status"] == "synced"),
        "results": results,
    }


@router.post("/all")
async def sync_all():
    products = fetch_all_products()
    if not products:
        raise HTTPException(status_code=400, detail="No products found")
    start = time.time()
    try:
        from ai.core.embeddings import PGVectorSearcher
        searcher = PGVectorSearcher(products)
        total = 0
        for p in products:
            pid = str(p.get("id", ""))
            name = p.get("name", "")
            delete_chunks_by_product(pid)
            chunk_text = f"Sản phẩm: {name}. Danh mục: {p.get('category', '')}. Mô tả: {p.get('description', '')}"
            embedding = searcher.encode_query(chunk_text)
            save_chunks([{
                "id": f"{pid}_product", "product_id": pid, "chunk_type": "product",
                "text": chunk_text, "embedding": embedding,
                "metadata": {"product_name": name, "category": p.get("category", ""), "price": p.get("price", 0)},
            }])
            total += 1
        ms = int((time.time() - start) * 1000)
        log_sync("ALL", f"{len(products)} products", "full_sync", total, "success", ms)
        return {"status": "completed", "products_synced": total, "duration_ms": ms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
