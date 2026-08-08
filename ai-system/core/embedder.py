"""BGE-M3 embedding encoder."""
import sys
import os
import logging
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_model = None


def _get_model():
    """Load BGE-M3 model (singleton)."""
    global _model
    if _model is None:
        logger.info(f"Loading BGE-M3 model on {settings.EMBEDDING_DEVICE}...")
        try:
            from FlagEmbedding import BGEM3FlagModel
            _model = BGEM3FlagModel(
                settings.EMBEDDING_MODEL,
                use_fp16=(settings.EMBEDDING_DEVICE == "cuda"),
                device=settings.EMBEDDING_DEVICE,
            )
            logger.info("BGE-M3 model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load BGE-M3: {e}")
            _model = None
    return _model


def encode_texts(texts: list[str]) -> np.ndarray:
    """Encode list of texts to vectors."""
    if not texts:
        return np.array([])

    model = _get_model()
    if model is None:
        logger.warning("BGE-M3 not available, returning zero vectors")
        return np.zeros((len(texts), 1024))

    try:
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
        logger.error(f"Encoding failed: {e}")
        return np.zeros((len(texts), 1024))


def encode_query(query: str) -> np.ndarray:
    """Encode single query to vector."""
    result = encode_texts([query])
    return result[0] if len(result) > 0 else np.zeros(1024)
