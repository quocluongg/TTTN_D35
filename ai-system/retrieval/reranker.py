"""
Re-ranker: Sử dụng Cross-Encoder (BAAI/bge-reranker-v2-m3) để đánh giá lại điểm số liên quan giữa query và các tài liệu.
Áp dụng cơ chế Singleton pattern.
"""
import logging
from typing import List

import torch
from FlagEmbedding import FlagReranker

from retrieval.hybrid_retriever import RetrievedDocument
from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_reranker_instance = None


class BGEReranker:
    def __init__(self, model_name: str = settings.RERANKER_MODEL_NAME):
        self.model_name = model_name
        self.model = None
        self.device = settings.RERANKER_DEVICE or ("cuda" if torch.cuda.is_available() else "cpu")
        self._is_loaded = False

    def load_model(self) -> None:
        if self._is_loaded:
            return

        logger.info(f"Loading Re-ranker model '{self.model_name}' on {self.device}...")
        try:
            self.model = FlagReranker(
                self.model_name,
                use_fp16=(self.device == "cuda"),
                device=self.device,
            )
            self._is_loaded = True
            logger.info("Re-ranker loaded successfully.")
        except Exception as e:
            logger.warning(f"Không thể tải Re-ranker model '{self.model_name}': {e}. Sẽ dùng RRF fallback mode.")
            self._is_loaded = True
            self.model = None


    def rerank(self, query: str, documents: List[RetrievedDocument], top_k: int | None = None) -> List[RetrievedDocument]:
        """
        Đánh giá lại thứ tự các tài liệu được retrieved dựa trên điểm Cross-Encoder.
        """
        if not documents:
            return []

        top_k = top_k or settings.RERANK_TOP_K

        if not self._is_loaded:
            self.load_model()

        # Fallback nếu model chưa tải được: giữ nguyên thứ tự RRF và cắt theo top_k
        if self.model is None:
            return documents[:top_k]

        try:
            pairs = [[query, doc.text] for doc in documents]
            scores = self.model.compute_score(pairs, normalize=True)

            if isinstance(scores, (float, int)):
                scores = [scores]

            for doc, score in zip(documents, scores):
                doc.score = float(score)

            reranked = sorted(documents, key=lambda d: d.score, reverse=True)
            return reranked[:top_k]

        except Exception as e:
            logger.error(f"Lỗi khi thực hiện Re-ranking: {e}")
            return documents[:top_k]


def get_reranker() -> BGEReranker:
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = BGEReranker()
    return _reranker_instance


def rerank_documents(query: str, documents: List[RetrievedDocument], top_k: int | None = None) -> List[RetrievedDocument]:
    """Hàm tiện ích cho luồng retrieval."""
    reranker = get_reranker()
    return reranker.rerank(query, documents, top_k=top_k)
