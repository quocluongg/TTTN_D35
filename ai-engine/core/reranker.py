import numpy as np
import logging
from typing import List, Dict

class Stage2Reranker:
    """
    Stage 2: Heavy Reranking
    Sử dụng mô hình Cross-Encoder để chấm điểm tương thích chi tiết (Cross-Attention) 
    giữa câu truy vấn (Query) và từng sản phẩm ứng viên rút gọn từ Stage 1.
    """
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model_name = model_name
        try:
            print(f"[Reranker] Loading Cross-Encoder model: {model_name}...")
            from sentence_transformers import CrossEncoder
            self.model = CrossEncoder(model_name)
            print("[Reranker] Cross-Encoder loaded successfully.")
        except Exception as e:
            print(f"[Reranker] Could not load CrossEncoder ({e}), using Stage 1 hybrid scores as fallback.")
            self.model = None

    def rerank(self, query: str, candidates: List[Dict], top_k: int = 10) -> List[Dict]:
        """
        Nhận vào danh sách ứng viên Top N từ Stage 1, tiến hành chấm điểm Cross-Encoder 
        và kết hợp với điểm Stage 1 để xếp hạng lại Top K cuối cùng.
        """
        if not candidates or not query.strip():
            return candidates[:top_k]

        if self.model is None:
            reranked_candidates = []
            for p in candidates:
                p_copy = dict(p)
                p_copy['cross_encoder_score'] = p.get('stage1_score', 0.0)
                p_copy['final_score'] = p.get('stage1_score', 0.0)
                reranked_candidates.append(p_copy)
            reranked_candidates.sort(key=lambda x: x['final_score'], reverse=True)
            return reranked_candidates[:top_k]

        try:
            # Tạo danh sách cặp (query, doc_text)
            pairs = []
            for p in candidates:
                doc_text = f"{p.get('name', '')}. {p.get('category', '')}. {p.get('use_case', '')}. {p.get('description', '')}"
                pairs.append((query, doc_text))

            # Chấm điểm Cross-Encoder (Score dạng float / logit)
            raw_ce_scores = self.model.predict(pairs)

            # Sigmoid normalization chuyển raw score về khoảng [0, 1]
            ce_scores = 1.0 / (1.0 + np.exp(-raw_ce_scores))

            reranked_candidates = []
            for idx, p in enumerate(candidates):
                p_copy = dict(p)
                ce_score = float(ce_scores[idx])
                s1_score = p.get('stage1_score', 0.0)

                # Điểm Stage 2 tổng hợp: 60% Cross-Encoder Score + 40% Stage 1 Hybrid Score
                final_score = round(0.60 * ce_score + 0.40 * s1_score, 4)

                p_copy['cross_encoder_score'] = round(ce_score, 4)
                p_copy['final_score'] = final_score
                reranked_candidates.append(p_copy)

            # Sắp xếp theo điểm final_score giảm dần
            reranked_candidates.sort(key=lambda x: x['final_score'], reverse=True)
            return reranked_candidates[:top_k]
        except Exception as e:
            print(f"[Reranker] Exception during rerank ({e}), falling back to Stage 1 scores.")
            reranked_candidates = []
            for p in candidates:
                p_copy = dict(p)
                p_copy['cross_encoder_score'] = p.get('stage1_score', 0.0)
                p_copy['final_score'] = p.get('stage1_score', 0.0)
                reranked_candidates.append(p_copy)
            return reranked_candidates[:top_k]
