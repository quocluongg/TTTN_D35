from typing import List, Dict, Optional
from core.bm25 import BM25Searcher
from core.embeddings import VectorSearcher
from core.reranker import Stage2Reranker
from core.mmr import Stage3MMRDiversifier

class Stage01Retriever:
    """Bộ thu hồi ứng viên (Stage 0), Xếp hạng nhẹ Hybrid Scoring (Stage 1), Heavy Reranking (Stage 2) & MMR Diversity (Stage 3)"""
    def __init__(self, products: List[Dict], enable_stage2: bool = True, enable_stage3: bool = True):
        self.products = products
        self.bm25_searcher = BM25Searcher(products)
        self.vector_searcher = VectorSearcher(products)
        self.reranker = Stage2Reranker() if enable_stage2 else None
        self.diversifier = Stage3MMRDiversifier() if enable_stage3 else None

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
        candidate_pool_size: int = 20
    ) -> List[Dict]:
        """
        Stage 0: Hard Filters + Candidate Generation
        Stage 1: Hybrid Scoring (Lexical + Semantic + Budget Match + Popularity)
        Stage 2: Cross-Encoder Heavy Reranking (nếu use_stage2=True)
        Stage 3: Maximal Marginal Relevance (MMR) Diversity Re-ordering (nếu use_stage3=True)
        """
        # 1. Lấy điểm số từ BM25 và Vector Search
        bm25_scores = self.bm25_searcher.get_scores(query)
        vector_scores = self.vector_searcher.get_scores(query)

        candidates = []
        for idx, p in enumerate(self.products):
            # --- STAGE 0: HARD FILTERS ---
            if category and p.get('category', '').lower() != category.lower():
                continue
            if use_case and p.get('use_case', '').lower() != use_case.lower():
                continue
            if max_price and p.get('price', 0.0) > max_price:
                continue

            # --- STAGE 1: HYBRID SCORING ---
            lex_score = bm25_scores[idx]
            sem_score = vector_scores[idx]
            
            # Điểm khớp ngân sách (nếu có max_price)
            budget_score = 1.0
            if max_price and max_price > 0:
                price_ratio = p.get('price', 0.0) / max_price
                budget_score = 1.0 - abs(1.0 - price_ratio)

            # Điểm đánh giá / độ hot
            rating = p.get('rating', 5.0) / 5.0
            
            # Điểm tổng hợp Hybrid Score (50% Lexical + 30% Semantic + 10% Budget + 10% Rating)
            hybrid_score = (
                0.50 * lex_score + 
                0.30 * sem_score + 
                0.10 * budget_score + 
                0.10 * rating
            )

            p_copy = dict(p)
            p_copy['_index'] = idx  # Lưu vị trí gốc của sản phẩm để tra cứu vector embedding ở Stage 3
            p_copy['stage1_score'] = round(hybrid_score, 4)
            p_copy['lexical_score'] = round(lex_score, 4)
            p_copy['semantic_score'] = round(sem_score, 4)
            candidates.append(p_copy)

        # Sắp xếp ứng viên theo điểm Hybrid Score giảm dần
        candidates.sort(key=lambda x: x['stage1_score'], reverse=True)

        pool_size = max(candidate_pool_size, top_k * 2)

        # --- STAGE 2: HEAVY RERANKING ---
        if use_stage2 and self.reranker and candidates:
            top_stage1 = candidates[:pool_size]
            candidates = self.reranker.rerank(query=query, candidates=top_stage1, top_k=pool_size)

        # --- STAGE 3: MMR DIVERSITY RE-ORDERING ---
        if use_stage3 and self.diversifier and candidates:
            top_pool = candidates[:pool_size]
            final_results = self.diversifier.rerank(
                candidates=top_pool,
                embeddings=self.vector_searcher.embeddings,
                top_k=top_k,
                lambda_param=mmr_lambda
            )
            return final_results

        return candidates[:top_k]


