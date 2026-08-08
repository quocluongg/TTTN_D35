"""
Quick sync script - only sync first N products for testing.
"""
import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.db import fetch_all_products
from data_pipeline.chunking.chunk_orchestrator import chunk_product
from embedding.bge_m3_encoder import encode_texts
from indexing import hybrid_indexer


async def sync_sample_products(num_products: int = 10):
    """Sync only first N products for quick testing."""
    print("=" * 60)
    print(f"RAG Chatbot - Quick Sync ({num_products} products)")
    print("=" * 60)

    # Step 1: Fetch products
    print("\n[1/4] Fetching products from database...")
    all_products = fetch_all_products()

    # Deduplicate products by ID (SQL JOIN may return duplicates)
    seen_ids = set()
    unique_products = []
    for p in all_products:
        pid = str(p.get("id", ""))
        if pid not in seen_ids:
            seen_ids.add(pid)
            unique_products.append(p)

    products = unique_products[:num_products]
    print(f"  Found {len(all_products)} rows, {len(unique_products)} unique products, syncing first {len(products)}")

    # Step 2: Generate chunks
    print("\n[2/4] Generating chunks...")
    all_chunks = []
    for product in products:
        chunks = chunk_product(product)
        all_chunks.extend(chunks)
    print(f"  Generated {len(all_chunks)} chunks")

    # Step 3: Generate embeddings
    print("\n[3/4] Generating embeddings...")
    texts = [c.text for c in all_chunks]
    embeddings = encode_texts(texts)
    for chunk, embedding in zip(all_chunks, embeddings):
        chunk.embedding = embedding
    print(f"  Generated {len(embeddings)} embeddings")

    # Step 4: Index
    print("\n[4/4] Indexing into ChromaDB + BM25...")
    hybrid_indexer.index_chunks(all_chunks)
    print(f"  Indexed {len(all_chunks)} chunks")

    print("\n" + "=" * 60)
    print("Quick sync completed!")
    print(f"Products synced: {len(products)}")
    print(f"Chunks indexed: {len(all_chunks)}")
    print("=" * 60)

    # Print sample products
    print("\nSample products synced:")
    for i, p in enumerate(products[:5]):
        print(f"  {i+1}. {p.get('name', 'N/A')} - {p.get('brand', 'N/A')}")


if __name__ == "__main__":
    num = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    asyncio.run(sync_sample_products(num))
