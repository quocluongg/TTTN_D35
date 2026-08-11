"""4-Stage Retriever: BM25 + pgvector Hybrid Search + Reranker + MMR."""
from typing import List, Dict, Optional
import numpy as np
from core.bm25 import BM25Searcher
from core.embeddings import PGVectorSearcher
from core.reranker import Stage2Reranker
from core.mmr import Stage3MMRDiversifier


class Stage01Retriever:
    """Stage 0: Hard Filters, Stage 1: Hybrid Scoring, Stage 2: Reranking, Stage 3: MMR Diversity."""

    def __init__(self, products: List[Dict], enable_stage2: bool = True, enable_stage3: bool = True):
        self.products = products
        self.bm25_searcher = BM25Searcher(products)
        self.vector_searcher = PGVectorSearcher(products)
        self.reranker = Stage2Reranker() if enable_stage2 else None
        self.diversifier = Stage3MMRDiversifier() if enable_stage3 else None

    def _build_candidate_embeddings(self, candidates: List[Dict]) -> np.ndarray | None:
        """Build embeddings matrix for MMR from pgvector."""
        try:
            from db.supabase_client import get_chunk_embeddings_by_product_ids

            product_ids = [str(c.get("id", "")) for c in candidates]
            emb_map = get_chunk_embeddings_by_product_ids(product_ids)

            # Average chunk embeddings per product
            embeddings = []
            for c in candidates:
                pid = str(c.get("id", ""))
                chunk_embs = emb_map.get(pid, [])
                if chunk_embs:
                    avg_emb = np.mean(chunk_embs, axis=0)
                    embeddings.append(avg_emb)
                else:
                    # Zero vector fallback
                    dim = 1024  # BGE-M3 dimension
                    embeddings.append(np.zeros(dim, dtype=np.float32))

            return np.array(embeddings, dtype=np.float32)

        except Exception as e:
            import logging
            logging.warning(f"Failed to build candidate embeddings for MMR: {e}")
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
        """
        Stage 0: Hard Filters + Candidate Generation
        Stage 1: Hybrid Scoring (Lexical + Semantic + Budget + Rating)
        Stage 2: Cross-Encoder Heavy Reranking
        Stage 3: MMR Diversity Re-ordering
        """
        # Get BM25 and pgvector scores
        bm25_scores = self.bm25_searcher.get_scores(query)
        vector_scores = self.vector_searcher.get_scores(query)

        candidates = []
        for idx, p in enumerate(self.products):
            # --- STAGE 0: HARD FILTERS ---
            if category and p.get("category", "").lower() != category.lower():
                continue
            if use_case and p.get("use_case", "").lower() != use_case.lower():
                continue
            if max_price and p.get("price", 0.0) > max_price:
                continue

            # --- STAGE 1: HYBRID SCORING ---
            lex_score = bm25_scores[idx]
            sem_score = vector_scores[idx]

            budget_score = 1.0
            if max_price and max_price > 0:
                price_ratio = p.get("price", 0.0) / max_price
                budget_score = 1.0 - abs(1.0 - price_ratio)

            rating = p.get("rating", 5.0) / 5.0

            hybrid_score = (
                0.50 * lex_score
                + 0.30 * sem_score
                + 0.10 * budget_score
                + 0.10 * rating
            )

            p_copy = dict(p)
            p_copy["_index"] = idx
            p_copy["stage1_score"] = round(hybrid_score, 4)
            p_copy["lexical_score"] = round(lex_score, 4)
            p_copy["semantic_score"] = round(sem_score, 4)
            candidates.append(p_copy)

        candidates.sort(key=lambda x: x["stage1_score"], reverse=True)

        pool_size = max(candidate_pool_size, top_k * 2)

        # --- STAGE 2: HEAVY RERANKING ---
        if use_stage2 and self.reranker and candidates:
            top_stage1 = candidates[:pool_size]
            candidates = self.reranker.rerank(query=query, candidates=top_stage1, top_k=pool_size)

        # --- STAGE 3: MMR DIVERSITY ---
        if use_stage3 and self.diversifier and candidates:
            top_pool = candidates[:pool_size]
            # Build embeddings from pgvector for MMR
            embeddings = self._build_candidate_embeddings(top_pool)
            if embeddings is not None:
                final_results = self.diversifier.rerank(
                    candidates=top_pool,
                    embeddings=embeddings,
                    top_k=top_k,
                    lambda_param=mmr_lambda,
                )
                return final_results

        return candidates[:top_k]
