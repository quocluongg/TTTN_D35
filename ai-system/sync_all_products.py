"""
Script to sync all existing products from database to RAG system.
Run this once to index all products into ChromaDB + BM25.
"""
import sys
import os
import asyncio

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.db import fetch_all_products
from data_pipeline.chunking.chunk_orchestrator import chunk_product
from embedding.bge_m3_encoder import encode_texts
from indexing import hybrid_indexer


async def sync_all_products():
    """Fetch all products from DB, chunk, embed, and index."""
    print("=" * 60)
    print("RAG Chatbot - Full Product Sync")
    print("=" * 60)

    # Step 1: Fetch all products
    print("\n[1/4] Fetching products from database...")
    products = fetch_all_products()
    print(f"  Found {len(products)} products")

    if not products:
        print("  No products found. Exiting.")
        return

    # Step 2: Generate chunks
    print("\n[2/4] Generating chunks...")
    all_chunks = []
    for product in products:
        chunks = chunk_product(product)
        all_chunks.extend(chunks)
    print(f"  Generated {len(all_chunks)} chunks ({len(chunks)} per product)")

    # Step 3: Generate embeddings
    print("\n[3/4] Generating embeddings (this may take a while on CPU)...")
    texts = [c.text for c in all_chunks]
    embeddings = encode_texts(texts)
    for chunk, embedding in zip(all_chunks, embeddings):
        chunk.embedding = embedding
    print(f"  Generated {len(embeddings)} embeddings")

    # Step 4: Index into ChromaDB + BM25
    print("\n[4/4] Indexing into ChromaDB + BM25...")
    hybrid_indexer.index_chunks(all_chunks)
    print(f"  Indexed {len(all_chunks)} chunks")

    print("\n" + "=" * 60)
    print("Sync completed successfully!")
    print(f"Total products: {len(products)}")
    print(f"Total chunks: {len(all_chunks)}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(sync_all_products())
