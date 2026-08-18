"""Sync management endpoints."""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db.supabase_client import (
    fetch_all_products,
    fetch_product_by_id,
    save_chunks_to_supabase,
    delete_chunks_by_product,
    get_all_chunk_ids_by_product,
)
from admin.logs import log_sync

router = APIRouter(prefix="/admin/sync", tags=["admin-sync"])


class BatchSyncRequest(BaseModel):
    product_ids: list[str]


def _sync_one_product(product_id: str) -> dict:
    """Sync a single product: chunk + embed + save to pgvector."""
    product = fetch_product_by_id(product_id)
    if not product:
        return {"product_id": product_id, "status": "not_found"}

    start = time.time()

    try:
        from core.embeddings import PGVectorSearcher
        searcher = PGVectorSearcher([product])

        # Remove old chunks
        delete_chunks_by_product(product_id)

        # Generate chunk
        name = product.get("name", "")
        chunk_text = f"Sản phẩm: {name}. Danh mục: {product.get('category', '')}. Mô tả: {product.get('description', '')}"
        embedding = searcher.encode_query(chunk_text)

        chunk = {
            "id": f"{product_id}_product",
            "product_id": product_id,
            "chunk_type": "product",
            "text": chunk_text,
            "embedding": embedding,
            "metadata": {
                "product_name": name,
                "category": product.get("category", ""),
                "price": product.get("price", 0),
            },
        }
        save_chunks_to_supabase([chunk])

        duration_ms = int((time.time() - start) * 1000)

        log_sync(
            product_id=product_id,
            product_name=name,
            action="sync",
            chunks=1,
            status="success",
            duration_ms=duration_ms,
        )

        return {
            "product_id": product_id,
            "product_name": name,
            "status": "synced",
            "chunks": 1,
            "duration_ms": duration_ms,
        }

    except Exception as e:
        return {
            "product_id": product_id,
            "status": "error",
            "error": str(e),
        }


# ============ ENDPOINTS ============


@router.get("/status")
@router.get("/rag/status")
async def get_sync_status():
    """Get sync status for all products."""
    all_products = fetch_all_products()
    chunk_mapping = get_all_chunk_ids_by_product()

    synced = []
    not_synced = []

    for product in all_products:
        pid = str(product.get("id", ""))
        product_info = {
            "id": pid,
            "name": product.get("name", ""),
            "brand": product.get("brand", ""),
            "category": product.get("category", ""),
            "price": float(product.get("price", 0)),
        }

        if pid in chunk_mapping:
            product_info["chunk_count"] = len(chunk_mapping[pid])
            product_info["status"] = "synced"
            synced.append(product_info)
        else:
            product_info["chunk_count"] = 0
            product_info["status"] = "not_synced"
            not_synced.append(product_info)

    return {
        "total_products": len(all_products),
        "synced_count": len(synced),
        "not_synced_count": len(not_synced),
        "sync_percentage": round(len(synced) / len(all_products) * 100, 1) if all_products else 0,
        "synced": synced,
        "not_synced": not_synced,
    }


@router.post("/product/{product_id}")
@router.post("/rag/product/{product_id}")
async def sync_single_product(product_id: str):
    """Sync a single product to pgvector."""
    result = _sync_one_product(product_id)
    if result["status"] == "not_found":
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return result


@router.post("/batch")
@router.post("/rag/batch")
async def sync_batch_products(request: BatchSyncRequest):
    """Sync multiple products to pgvector."""
    results = []
    total_chunks = 0
    start = time.time()

    for pid in request.product_ids:
        result = _sync_one_product(pid)
        results.append(result)
        if result["status"] == "synced":
            total_chunks += result.get("chunks", 0)

    duration_ms = int((time.time() - start) * 1000)

    return {
        "total_requested": len(request.product_ids),
        "total_synced": sum(1 for r in results if r["status"] == "synced"),
        "total_chunks": total_chunks,
        "duration_ms": duration_ms,
        "results": results,
    }


@router.post("/all")
@router.post("/rag/all")
async def sync_all_products():
    """Full reindex: sync all products to pgvector."""
    products = fetch_all_products()
    if not products:
        raise HTTPException(status_code=400, detail="No products found")

    start = time.time()

    try:
        from core.embeddings import PGVectorSearcher
        searcher = PGVectorSearcher(products)

        total_chunks = 0
        results = []

        for p in products:
            pid = str(p.get("id", ""))
            name = p.get("name", "")

            try:
                # Delete old chunks
                delete_chunks_by_product(pid)

                # Generate chunk + embedding
                chunk_text = f"Sản phẩm: {name}. Danh mục: {p.get('category', '')}. Mô tả: {p.get('description', '')}"
                embedding = searcher.encode_query(chunk_text)

                chunk = {
                    "id": f"{pid}_product",
                    "product_id": pid,
                    "chunk_type": "product",
                    "text": chunk_text,
                    "embedding": embedding,
                    "metadata": {
                        "product_name": name,
                        "category": p.get("category", ""),
                        "price": p.get("price", 0),
                    },
                }
                save_chunks_to_supabase([chunk])
                total_chunks += 1
                results.append({"product_id": pid, "status": "synced"})

            except Exception as e:
                results.append({"product_id": pid, "status": "error", "error": str(e)})

        duration_ms = int((time.time() - start) * 1000)

        log_sync(
            product_id="ALL",
            product_name=f"{len(products)} products",
            action="full_sync",
            chunks=total_chunks,
            status="success",
            duration_ms=duration_ms,
        )

        return {
            "status": "completed",
            "products_synced": len(products),
            "chunks_created": total_chunks,
            "duration_ms": duration_ms,
            "errors": sum(1 for r in results if r["status"] == "error"),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Full sync failed: {str(e)}")
