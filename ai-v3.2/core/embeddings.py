"""PGVector-based semantic search using Supabase pgvector extension."""
import os
import sys
import logging
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sentence_transformers import SentenceTransformer
from db.supabase_client import search_chunks_pgvector

logger = logging.getLogger(__name__)


class PGVectorSearcher:
    """Semantic vector search using Supabase pgvector (replaces FAISS)."""

    def __init__(self, products: List[Dict] = None, model_name: str = "BAAI/bge-m3"):
        self.products = products or []
        self.model_name = model_name
        self.model = None

        # Load embedding model
        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"Loaded embedding model: {self.model_name}")
        except Exception as e:
            fallback = "paraphrase-multilingual-MiniLM-L12-v2"
            logger.warning(f"Cannot load {self.model_name} ({e}), fallback: {fallback}")
            self.model = SentenceTransformer(fallback)

    def encode_query(self, query: str) -> List[float]:
        """Encode a query string into embedding vector."""
        embedding = self.model.encode(
            [query], normalize_embeddings=True, convert_to_numpy=True
        ).astype("float32")
        return embedding[0].tolist()

    def get_scores(self, query: str) -> List[float]:
        """Compute cosine similarity scores between query and each product via pgvector."""
        num_products = len(self.products)
        if not query.strip() or num_products == 0:
            return [0.0] * num_products

        query_embedding = self.encode_query(query)

        # Search top-k chunks from pgvector (fetch enough to cover all products)
        top_k = min(num_products * 3, 200)
        results = search_chunks_pgvector(query_embedding, top_k=top_k)

        # Map chunk similarity scores to product_id (best chunk score per product)
        product_scores_map: Dict[str, float] = {}
        for r in results:
            pid = str(r.get("product_id", ""))
            score = float(r.get("similarity", 0.0))
            if pid not in product_scores_map or score > product_scores_map[pid]:
                product_scores_map[pid] = score

        # Build scores list aligned with self.products
        scores = []
        for p in self.products:
            pid = str(p.get("id", ""))
            scores.append(product_scores_map.get(pid, 0.0))

        return scores

    def search_chunks(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Return top-k chunks from pgvector for RAG pipeline."""
        if not query.strip():
            return []

        query_embedding = self.encode_query(query)
        results = search_chunks_pgvector(query_embedding, top_k=top_k)

        chunks = []
        for r in results:
            chunks.append({
                "id": r.get("id", ""),
                "product_id": r.get("product_id", ""),
                "chunk_type": r.get("chunk_type", ""),
                "text": r.get("chunk_text", ""),
                "product_name": r.get("product_name", ""),
                "category": r.get("category", ""),
                "price": float(r.get("price", 0)),
                "similarity_score": round(float(r.get("similarity", 0.0)), 4),
            })
        return chunks
