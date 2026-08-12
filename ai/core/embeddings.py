"""PGVector-based semantic search using Supabase pgvector extension."""
import logging
from typing import Any, Dict, List

from sentence_transformers import SentenceTransformer

from ai.core.db import search_chunks_pgvector

logger = logging.getLogger(__name__)


class PGVectorSearcher:
    """Semantic vector search using Supabase pgvector."""

    def __init__(self, products: list = None, model_name: str = "BAAI/bge-m3"):
        self.products = products or []
        self.model_name = model_name
        self.model = None

        try:
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"[Embeddings] Loaded model: {self.model_name}")
        except Exception as e:
            # Try loading from older cached snapshot
            import os
            cache_dir = os.path.expanduser("~/.cache/huggingface/hub/models--BAAI--bge-m3/snapshots/5617a9f61b028005a4858fdac845db406aefb181")
            try:
                self.model = SentenceTransformer(cache_dir)
                logger.info(f"[Embeddings] Loaded BGE-M3 from cache snapshot.")
            except Exception:
                fallback = "paraphrase-multilingual-MiniLM-L12-v2"
                logger.warning(f"[Embeddings] Cannot load {self.model_name} ({e}), fallback: {fallback}")
                self.model = SentenceTransformer(fallback)

    def encode_query(self, query: str) -> List[float]:
        """Encode query string into embedding vector."""
        embedding = self.model.encode(
            [query], normalize_embeddings=True, convert_to_numpy=True
        ).astype("float32")
        return embedding[0].tolist()

    def encode_texts(self, texts: List[str]) -> List[List[float]]:
        """Encode multiple texts into embedding vectors."""
        embeddings = self.model.encode(
            texts, normalize_embeddings=True, convert_to_numpy=True,
            batch_size=16, show_progress_bar=False,
        ).astype("float32")
        return embeddings.tolist()

    def get_scores(self, query: str) -> List[float]:
        """Compute cosine similarity scores between query and each product via pgvector."""
        num_products = len(self.products)
        if not query.strip() or num_products == 0:
            return [0.0] * num_products

        query_embedding = self.encode_query(query)
        top_k = min(num_products * 3, 200)
        results = search_chunks_pgvector(query_embedding, top_k=top_k)

        product_scores: Dict[str, float] = {}
        for r in results:
            pid = str(r.get("product_id", ""))
            score = float(r.get("similarity", 0.0))
            if pid not in product_scores or score > product_scores[pid]:
                product_scores[pid] = score

        return [product_scores.get(str(p.get("id", "")), 0.0) for p in self.products]

    def max_similarity(self, query_embedding: List[float]) -> float:
        """Get max cosine similarity between query embedding and all product chunks."""
        results = search_chunks_pgvector(query_embedding, top_k=5)
        if not results:
            return 0.0
        return max(float(r.get("similarity", 0.0)) for r in results)

    def search_chunks(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Return top-k chunks from pgvector."""
        if not query.strip():
            return []
        query_embedding = self.encode_query(query)
        results = search_chunks_pgvector(query_embedding, top_k=top_k)
        return [
            {
                "id": r.get("id", ""),
                "product_id": r.get("product_id", ""),
                "chunk_type": r.get("chunk_type", ""),
                "text": r.get("chunk_text", ""),
                "product_name": r.get("product_name", ""),
                "category": r.get("category", ""),
                "price": float(r.get("price", 0)),
                "similarity_score": round(float(r.get("similarity", 0.0)), 4),
            }
            for r in results
        ]
