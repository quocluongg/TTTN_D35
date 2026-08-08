"""
Wrapper cho model BGE-M3 (đa ngôn ngữ, hỗ trợ tốt tiếng Việt).
Load model 1 lần duy nhất (singleton) vì load model tốn vài giây, không nên
load lại mỗi lần gọi hàm.
"""
import logging

import numpy as np
from FlagEmbedding import BGEM3FlagModel

from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_model_instance: BGEM3FlagModel | None = None


def _get_model() -> BGEM3FlagModel | None:
    global _model_instance
    if _model_instance is None:
        logger.info(f"Loading BGE-M3 model on {settings.EMBEDDING_DEVICE}...")
        try:
            _model_instance = BGEM3FlagModel(
                settings.EMBEDDING_MODEL_NAME,
                use_fp16=(settings.EMBEDDING_DEVICE == "cuda"),
                device=settings.EMBEDDING_DEVICE,
            )
        except Exception as e:
            logger.warning(f"Khởi tạo BGE-M3 model thất bại ({e}). Sẽ dùng fallback mode.")
            _model_instance = None
    return _model_instance


def encode_texts(texts: list[str]) -> np.ndarray:
    """
    Sinh dense embedding cho danh sách text.
    Trả về np.ndarray shape (n_texts, embedding_dim), đã normalize sẵn (dùng cosine similarity).
    """
    if not texts:
        return np.array([])

    try:
        model = _get_model()
        if model is None:
            return np.zeros((len(texts), 1024))

        output = model.encode(
            texts,
            batch_size=settings.EMBEDDING_BATCH_SIZE,
            max_length=1024,
            return_dense=True,
            return_sparse=False,
            return_colbert_vecs=False,
        )
        return output["dense_vecs"]
    except Exception as e:
        logger.warning(f"Lỗi khi sinh embedding BGE-M3: {e}")
        return np.zeros((len(texts), 1024))


def encode_query(query: str) -> np.ndarray:
    """Sinh embedding cho 1 câu query đơn lẻ (dùng ở phần retrieval, không phải ingestion)."""
    res = encode_texts([query])
    return res[0] if len(res) > 0 else np.zeros(1024)

