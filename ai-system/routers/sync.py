"""Sync router - Product ingestion."""
import sys
import os
import logging
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import APIKeyHeader
from config import get_settings
from core import chunker, embedder, retriever
from db.supabase_client import fetch_product_by_id

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/sync", tags=["sync"])

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Depends(api_key_header)):
    """Verify API key for sync endpoints."""
    if api_key != settings.RAG_SYNC_API_KEY:
        raise HTTPException(401, "Invalid API key")
    return api_key


@router.post("/product/{product_id}")
async def sync_product(product_id: str, api_key: str = Depends(verify_api_key)):
    """Sync single product to index."""
    # Fetch product
    product = fetch_product_by_id(product_id)
    if not product:
        raise HTTPException(404, f"Product {product_id} not found")

    # Remove old chunks
    retriever.remove_product_chunks(product_id)

    # Generate chunks
    chunks = chunker.chunk_product(product)
    if not chunks:
        raise HTTPException(400, "No chunks generated")

    # Generate embeddings
    texts = [c.text for c in chunks]
    embeddings = embedder.encode_texts(texts)
    for chunk, emb in zip(chunks, embeddings):
        chunk.embedding = emb.tolist()

    # Index
    retriever.index_chunks(chunks)

    return {
        "status": "synced",
        "product_id": product_id,
        "chunks_created": len(chunks),
    }


@router.delete("/product/{product_id}")
async def delete_product(product_id: str, api_key: str = Depends(verify_api_key)):
    """Remove product from index."""
    retriever.remove_product_chunks(product_id)
    return {"status": "deleted", "product_id": product_id}


@router.post("/reindex")
async def reindex_all(api_key: str = Depends(verify_api_key)):
    """Full reindex of all products."""
    from db.supabase_client import fetch_all_products

    products = fetch_all_products()
    if not products:
        raise HTTPException(400, "No products found")

    # Process in background
    asyncio.create_task(_reindex_products(products))

    return {
        "status": "started",
        "total_products": len(products),
    }


async def _reindex_products(products: list[dict]):
    """Background task to reindex all products."""
    logger.info(f"Starting reindex of {len(products)} products...")

    all_chunks = []
    for product in products:
        chunks = chunker.chunk_product(product)
        all_chunks.extend(chunks)

    # Generate embeddings in batches
    texts = [c.text for c in all_chunks]
    embeddings = embedder.encode_texts(texts)
    for chunk, emb in zip(all_chunks, embeddings):
        chunk.embedding = emb.tolist()

    # Clear and reindex
    retriever.load_index()  # Reset
    retriever.index_chunks(all_chunks)

    logger.info(f"Reindex completed: {len(all_chunks)} chunks from {len(products)} products")
