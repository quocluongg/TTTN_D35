"""4-Stage Retriever: Hard Filters + Hybrid Scoring + CrossEncoder Rerank + MMR Diversity."""
import logging
from typing import Dict, List, Optional

import numpy as np

from ai.core.bm25 import BM25Searcher
from ai.core.embeddings import PGVectorSearcher
from ai.core.mmr import Stage3MMRDiversifier
from ai.core.reranker import Stage2Reranker

logger = logging.getLogger(__name__)


class Stage01Retriever:
    """4-stage hybrid retrieval pipeline."""

    def __init__(self, products: List[Dict], settings=None, enable_stage2: bool = True, enable_stage3: bool = True):
        self.products = products
        self.settings = settings

        # Retrieval weights from settings or defaults
        if settings:
            self.bm25_w = settings.BM25_WEIGHT
            self.vector_w = settings.VECTOR_WEIGHT
            self.budget_w = settings.BUDGET_WEIGHT
            self.rating_w = settings.RATING_WEIGHT
        else:
            self.bm25_w, self.vector_w, self.budget_w, self.rating_w = 0.50, 0.30, 0.10, 0.10

        self.bm25_searcher = BM25Searcher(products)
        self.vector_searcher = PGVectorSearcher(products)
        self.reranker = Stage2Reranker() if enable_stage2 else None
        self.diversifier = Stage3MMRDiversifier() if enable_stage3 else None

        self.embeddings = self.vector_searcher  # expose for off-topic gate

    def _build_candidate_embeddings(self, candidates: List[Dict]) -> np.ndarray | None:
        """Build embeddings matrix for MMR from pgvector."""
        try:
            from ai.core.db import get_chunk_embeddings_by_product_ids

            product_ids = [str(c.get("id", "")) for c in candidates]
            emb_map = get_chunk_embeddings_by_product_ids(product_ids)

            embeddings = []
            for c in candidates:
                pid = str(c.get("id", ""))
                chunk_embs = emb_map.get(pid, [])
                if chunk_embs:
                    embeddings.append(np.mean(chunk_embs, axis=0))
                else:
                    embeddings.append(np.zeros(1024, dtype=np.float32))

            return np.array(embeddings, dtype=np.float32)
        except Exception as e:
            logger.warning(f"[Retriever] Failed to build embeddings for MMR: {e}")
            return None

    def retrieve_and_rank(
        self,
        query: str,
        category: Optional[str] = None,
        use_case: Optional[str] = None,
        max_price: Optional[float] = None,
        top_k: int = 10,
        use_stage2: bool = True,
        use_stage3: bool = True,
        mmr_lambda: float = 0.7,
        candidate_pool_size: int = 20,
    ) -> List[Dict]:
        """Full 4-stage retrieval pipeline."""
        bm25_scores = self.bm25_searcher.get_scores(query)
        vector_scores = self.vector_searcher.get_scores(query)

        candidates = []
        for idx, p in enumerate(self.products):
            # Stage 0: Hard filters
            if category and p.get("category", "").lower() != category.lower():
                continue
            if use_case and p.get("use_case", "").lower() != use_case.lower():
                continue
            if max_price and p.get("price", 0.0) > max_price:
                continue

            # Stage 1: Hybrid scoring
            lex = bm25_scores[idx]
            sem = vector_scores[idx]

            budget = 1.0
            if max_price and max_price > 0:
                ratio = p.get("price", 0.0) / max_price
                budget = 1.0 - abs(1.0 - ratio)

            rating = p.get("rating", 5.0) / 5.0

            hybrid = (
                self.bm25_w * lex
                + self.vector_w * sem
                + self.budget_w * budget
                + self.rating_w * rating
            )

            p_copy = dict(p)
            p_copy["_index"] = idx
            p_copy["stage1_score"] = round(hybrid, 4)
            p_copy["lexical_score"] = round(lex, 4)
            p_copy["semantic_score"] = round(sem, 4)
            candidates.append(p_copy)

        candidates.sort(key=lambda x: x["stage1_score"], reverse=True)
        pool_size = max(candidate_pool_size, top_k * 2)

        # Stage 2: Cross-Encoder reranking
        if use_stage2 and self.reranker and candidates:
            candidates = self.reranker.rerank(query, candidates[:pool_size], top_k=pool_size)

        # Stage 3: MMR diversity
        if use_stage3 and self.diversifier and candidates:
            embeddings = self._build_candidate_embeddings(candidates[:pool_size])
            if embeddings is not None:
                return self.diversifier.rerank(
                    candidates[:pool_size], embeddings, top_k=top_k, lambda_param=mmr_lambda
                )

        return candidates[:top_k]
