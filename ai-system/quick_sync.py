"""Quick sync - just 5 products for testing."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.supabase_client import fetch_all_products
from core.chunker import chunk_product
from core.embedder import encode_texts
from core import retriever

print("=" * 50)
print("Quick Sync - 5 products")
print("=" * 50)

# Fetch products
print("\n[1/4] Fetching products...")
products = fetch_all_products()
sample = products[:5]
print(f"  Found {len(products)} total, syncing {len(sample)}")

# Generate chunks
print("\n[2/4] Generating chunks...")
all_chunks = []
for p in sample:
    chunks = chunk_product(p)
    all_chunks.extend(chunks)
print(f"  Generated {len(all_chunks)} chunks")

# Generate embeddings
print("\n[3/4] Generating embeddings...")
texts = [c.text for c in all_chunks]
embeddings = encode_texts(texts)
for chunk, emb in zip(all_chunks, embeddings):
    chunk.embedding = emb.tolist()
print(f"  Generated {len(embeddings)} embeddings")

# Index
print("\n[4/4] Indexing...")
retriever.load_index()
retriever.index_chunks(all_chunks)

print("\n" + "=" * 50)
print("Quick sync completed!")
print(f"Products: {len(sample)}")
print(f"Chunks: {len(all_chunks)}")
print("=" * 50)
