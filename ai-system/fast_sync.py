"""Fast sync - all products with optimized batch processing."""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.supabase_client import fetch_all_products, save_chunks_to_supabase
from core.chunker import chunk_product
from core.embedder import encode_texts
from core import retriever

print("=" * 50)
print("FAST SYNC - All Products")
print("=" * 50)

start_time = time.time()

# Step 1: Fetch all products
print("\n[1/4] Fetching products from Supabase...")
products = fetch_all_products()
print(f"  Found {len(products)} unique products")

# Step 2: Generate all chunks
print("\n[2/4] Generating chunks...")
all_chunks = []
for p in products:
    chunks = chunk_product(p)
    all_chunks.extend(chunks)
print(f"  Generated {len(all_chunks)} chunks")

# Step 3: Generate embeddings in one batch
print("\n[3/4] Generating embeddings (single batch)...")
texts = [c.text for c in all_chunks]
embeddings = encode_texts(texts)
for chunk, emb in zip(all_chunks, embeddings):
    chunk.embedding = emb.tolist()
print(f"  Generated {len(embeddings)} embeddings")

# Step 4: Index to FAISS + BM25
print("\n[4/4] Indexing to FAISS + BM25...")
retriever.load_index()
retriever.index_chunks(all_chunks)

# Also save to Supabase
print("\n[5/5] Saving to Supabase pgvector...")
saved = save_chunks_to_supabase(all_chunks)

elapsed = time.time() - start_time

print("\n" + "=" * 50)
print("FAST SYNC COMPLETED!")
print(f"Products: {len(products)}")
print(f"Chunks: {len(all_chunks)}")
print(f"Saved to Supabase: {saved}")
print(f"Time: {elapsed:.1f} seconds")
print("=" * 50)
