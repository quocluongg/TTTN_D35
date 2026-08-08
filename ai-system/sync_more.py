"""Sync more products from different brands."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from db.supabase_client import fetch_all_products
from core.chunker import chunk_product
from core.embedder import encode_texts
from core import retriever

print("Syncing more products from different brands...")

# Fetch all products
products = fetch_all_products()

# Group by brand
brands = {}
for p in products:
    brand = p.get('brand', 'Unknown')
    if brand not in brands:
        brands[brand] = []
    brands[brand].append(p)

print(f"Found brands: {list(brands.keys())}")

# Get 2 products from each of the top 5 brands
sample = []
for brand in ['HP', 'Dell', 'ASUS', 'Acer', 'MSI']:
    if brand in brands:
        sample.extend(brands[brand][:2])

print(f"Syncing {len(sample)} products from {len(set(p['brand'] for p in sample))} brands")

# Generate chunks
all_chunks = []
for p in sample:
    chunks = chunk_product(p)
    all_chunks.extend(chunks)

# Generate embeddings
texts = [c.text for c in all_chunks]
embeddings = encode_texts(texts)
for chunk, emb in zip(all_chunks, embeddings):
    chunk.embedding = emb.tolist()

# Index
retriever.load_index()
retriever.index_chunks(all_chunks)

print(f"\nDone! Total chunks: {retriever.get_stats()['total_chunks']}")
