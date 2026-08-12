"""Stage 2: Cross-Encoder heavy reranking."""
import logging
from typing import Dict, List

import numpy as np

logger = logging.getLogger(__name__)


class Stage2Reranker:
    """Cross-Encoder reranker for candidate refinement."""

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model_name = model_name
        self.model = None
        try:
            logger.info(f"[Reranker] Loading Cross-Encoder: {model_name}")
            from sentence_transformers import CrossEncoder
            self.model = CrossEncoder(model_name)
            logger.info("[Reranker] Cross-Encoder loaded.")
        except Exception as e:
            logger.warning(f"[Reranker] Cannot load CrossEncoder ({e}), using Stage 1 scores.")

    def rerank(self, query: str, candidates: List[Dict], top_k: int = 10) -> List[Dict]:
        """Rerank candidates using Cross-Encoder + Stage 1 hybrid scores."""
        if not candidates or not query.strip():
            return candidates[:top_k]

        if self.model is None:
            for p in candidates:
                p["cross_encoder_score"] = p.get("stage1_score", 0.0)
                p["final_score"] = p.get("stage1_score", 0.0)
            candidates.sort(key=lambda x: x["final_score"], reverse=True)
            return candidates[:top_k]

        try:
            pairs = [
                (query, f"{p.get('name', '')}. {p.get('category', '')}. {p.get('use_case', '')}. {p.get('description', '')}")
                for p in candidates
            ]
            raw_scores = self.model.predict(pairs)
            ce_scores = 1.0 / (1.0 + np.exp(-raw_scores))  # sigmoid

            for idx, p in enumerate(candidates):
                ce = float(ce_scores[idx])
                s1 = p.get("stage1_score", 0.0)
                p["cross_encoder_score"] = round(ce, 4)
                p["final_score"] = round(0.60 * ce + 0.40 * s1, 4)

            candidates.sort(key=lambda x: x["final_score"], reverse=True)
            return candidates[:top_k]
        except Exception as e:
            logger.warning(f"[Reranker] Rerank failed ({e}), using Stage 1 scores.")
            for p in candidates:
                p["cross_encoder_score"] = p.get("stage1_score", 0.0)
                p["final_score"] = p.get("stage1_score", 0.0)
            return candidates[:top_k]
