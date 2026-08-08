"""
BM25 sparse index dùng rank_bm25.
Lưu ý: rank_bm25 không hỗ trợ incremental update thật sự - mỗi lần add/delete
đều cần rebuild lại BM25Okapi object từ toàn bộ corpus đang có trong memory.
Với quy mô vài nghìn - vài chục nghìn sản phẩm, rebuild mất ~vài trăm ms, chấp
nhận được cho luồng admin insert (không phải real-time chat).

Nếu sau này cần update tần suất cao / dữ liệu lớn hơn, nên chuyển sang
Elasticsearch/OpenSearch (có BM25 built-in, hỗ trợ update tốt hơn nhiều).
"""
import logging
import os
import pickle
import threading

from rank_bm25 import BM25Okapi

from config.settings import get_settings
# pyrefly: ignore [missing-import]
from data_pipeline.chunking.chunk_schema import Chunk

logger = logging.getLogger(__name__)
settings = get_settings()

_INDEX_FILE = os.path.join(settings.BM25_INDEX_DIR, "bm25_corpus.pkl")
_lock = threading.Lock()

# corpus lưu trong memory: {doc_id: {"text": ..., "metadata": ..., "tokens": [...]}}
_corpus: dict[str, dict] = {}
_bm25: BM25Okapi | None = None


def _tokenize(text: str) -> list[str]:
    """Tokenize đơn giản theo khoảng trắng + lowercase. Có thể thay bằng underthesea/pyvi sau."""
    return text.lower().split()


def _load_corpus() -> None:
    global _corpus
    os.makedirs(settings.BM25_INDEX_DIR, exist_ok=True)
    if os.path.exists(_INDEX_FILE):
        with open(_INDEX_FILE, "rb") as f:
            _corpus = pickle.load(f)
    else:
        _corpus = {}


def _persist_corpus() -> None:
    os.makedirs(settings.BM25_INDEX_DIR, exist_ok=True)
    with open(_INDEX_FILE, "wb") as f:
        pickle.dump(_corpus, f)


def _rebuild_bm25() -> None:
    global _bm25
    if not _corpus:
        _bm25 = None
        return
    tokenized_docs = [doc["tokens"] for doc in _corpus.values()]
    _bm25 = BM25Okapi(tokenized_docs)


def _ensure_loaded() -> None:
    if not _corpus and not os.path.exists(_INDEX_FILE):
        return
    if _bm25 is None:
        with _lock:
            _load_corpus()
            _rebuild_bm25()


def add_documents(chunks: list[Chunk]) -> None:
    if not chunks:
        return
    with _lock:
        _load_corpus()
        for chunk in chunks:
            _corpus[chunk.id] = {
                "text": chunk.text,
                "metadata": chunk.metadata_dict(),
                "tokens": _tokenize(chunk.text),
            }
        _persist_corpus()
        _rebuild_bm25()
    logger.info(f"Đã thêm {len(chunks)} chunks vào BM25 index")


def delete_by_product_id(product_id: str) -> None:
    with _lock:
        _load_corpus()
        ids_to_remove = [
            doc_id for doc_id, doc in _corpus.items()
            if doc["metadata"].get("product_id") == product_id
        ]
        for doc_id in ids_to_remove:
            del _corpus[doc_id]
        _persist_corpus()
        _rebuild_bm25()
    logger.info(f"Đã xóa {len(ids_to_remove)} chunks của product_id={product_id} khỏi BM25 index")


def search(query: str, top_k: int = 20, filters: dict | None = None) -> list[dict]:
    """Sparse search - dùng ở phần retrieval (chat)."""
    _ensure_loaded()
    if _bm25 is None:
        return []

    doc_ids = list(_corpus.keys())
    scores = _bm25.get_scores(_tokenize(query))

    ranked = sorted(zip(doc_ids, scores), key=lambda x: -x[1])

    hits = []
    for doc_id, score in ranked:
        doc = _corpus[doc_id]
        if filters and not all(doc["metadata"].get(k) == v for k, v in filters.items()):
            continue
        hits.append({"id": doc_id, "text": doc["text"], "metadata": doc["metadata"], "score": score})
        if len(hits) >= top_k:
            break

    return hits
