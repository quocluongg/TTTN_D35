"""Stage 3: Maximal Marginal Relevance (MMR) diversity re-ordering."""
from typing import Dict, List, Optional

import numpy as np


class Stage3MMRDiversifier:
    """MMR-based diversity optimization for search results."""

    def __init__(self, default_lambda: float = 0.7):
        self.default_lambda = default_lambda

    def rerank(
        self,
        candidates: List[Dict],
        embeddings: np.ndarray,
        top_k: int = 10,
        lambda_param: Optional[float] = None,
    ) -> List[Dict]:
        """Diversify candidates using MMR on embeddings.

        Args:
            candidates: Items from Stage 1/2 with '_index' and score keys.
            embeddings: n_products x dim float32 array.
            top_k: Number of results to return.
            lambda_param: Balance (0=diverse, 1=relevant).
        """
        if not candidates or len(candidates) <= 1:
            return candidates[:top_k]

        lam = lambda_param if lambda_param is not None else self.default_lambda

        # Extract relevance scores
        raw_scores = np.array(
            [float(c.get("final_score", c.get("stage1_score", 0.0))) for c in candidates],
            dtype=np.float32,
        )
        min_s, max_s = raw_scores.min(), raw_scores.max()
        norm_scores = (raw_scores - min_s) / (max_s - min_s) if max_s > min_s else np.ones_like(raw_scores)

        # Build candidate embeddings
        cand_indices = [c["_index"] for c in candidates]
        if embeddings is not None and len(embeddings) > 0:
            safe_indices = [min(max(idx, 0), len(embeddings) - 1) for idx in cand_indices]
            cand_embs = embeddings[safe_indices]
        else:
            cand_embs = np.eye(len(candidates), dtype=np.float32)

        # Normalize for cosine similarity
        norms = np.linalg.norm(cand_embs, axis=1, keepdims=True)
        norms[norms == 0] = 1e-10
        norm_embs = cand_embs / norms
        sim_matrix = np.dot(norm_embs, norm_embs.T)

        # MMR selection
        unselected = list(range(len(candidates)))
        selected = []

        # First: highest relevance
        best_first = int(np.argmax(norm_scores))
        selected.append(best_first)
        unselected.remove(best_first)
        candidates[best_first]["mmr_score"] = round(float(norm_scores[best_first]), 4)
        candidates[best_first]["diversity_penalty"] = 0.0

        # Remaining: maximize MMR
        while len(selected) < min(top_k, len(candidates)) and unselected:
            best_mmr = -1e9
            best_idx = -1
            best_sim = 0.0

            for u in unselected:
                max_sim = max(float(sim_matrix[u, s]) for s in selected)
                mmr_val = lam * float(norm_scores[u]) - (1.0 - lam) * max_sim
                if mmr_val > best_mmr:
                    best_mmr = mmr_val
                    best_idx = u
                    best_sim = max_sim

            if best_idx != -1:
                candidates[best_idx]["mmr_score"] = round(float(best_mmr), 4)
                candidates[best_idx]["diversity_penalty"] = round(float(best_sim), 4)
                selected.append(best_idx)
                unselected.remove(best_idx)

        return [candidates[i] for i in selected]
