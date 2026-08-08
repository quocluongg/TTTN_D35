"""Hybrid retriever with FAISS + BM25."""
import sys
import os
import logging
import pickle
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# FAISS state
_faiss_index = None
_faiss_id_map = {}  # {faiss_idx: chunk_id}
_chunk_metadata = {}  # {chunk_id: {text, metadata}}

# BM25 state
_bm25 = None
_bm25_corpus = {}  # {chunk_id: {"text": ..., "tokens": [...]}}


def _tokenize(text: str) -> list[str]:
    """Simple whitespace tokenizer."""
    return text.lower().split()


def load_index():
    """Load FAISS and BM25 indices from disk."""
    global _faiss_index, _faiss_id_map, _chunk_metadata, _bm25, _bm25_corpus

    os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH), exist_ok=True)

    # Load FAISS
    if os.path.exists(settings.FAISS_INDEX_PATH):
        try:
            import faiss
            _faiss_index = faiss.read_index(settings.FAISS_INDEX_PATH)
            with open(settings.FAISS_INDEX_PATH + ".pkl", "rb") as f:
                data = pickle.load(f)
                _faiss_id_map = data.get("id_map", {})
                _chunk_metadata = data.get("metadata", {})
            logger.info(f"Loaded FAISS index: {_faiss_index.ntotal} vectors")
        except Exception as e:
            logger.warning(f"Failed to load FAISS: {e}")
            _faiss_index = None

    # Load BM25
    if os.path.exists(settings.BM25_INDEX_PATH):
        try:
            with open(settings.BM25_INDEX_PATH, "rb") as f:
                _bm25_corpus = pickle.load(f)
            if _bm25_corpus:
                from rank_bm25 import BM25Okapi
                tokenized = [doc["tokens"] for doc in _bm25_corpus.values()]
                _bm25 = BM25Okapi(tokenized)
            logger.info(f"Loaded BM25 index: {len(_bm25_corpus)} documents")
        except Exception as e:
            logger.warning(f"Failed to load BM25: {e}")


def save_index():
    """Save FAISS and BM25 indices to disk."""
    import faiss

    os.makedirs(os.path.dirname(settings.FAISS_INDEX_PATH), exist_ok=True)

    # Save FAISS
    if _faiss_index is not None:
        faiss.write_index(_faiss_index, settings.FAISS_INDEX_PATH)
        with open(settings.FAISS_INDEX_PATH + ".pkl", "wb") as f:
            pickle.dump({"id_map": _faiss_id_map, "metadata": _chunk_metadata}, f)
        logger.info(f"Saved FAISS index: {_faiss_index.ntotal} vectors")

    # Save BM25
    with open(settings.BM25_INDEX_PATH, "wb") as f:
        pickle.dump(_bm25_corpus, f)
    logger.info(f"Saved BM25 index: {len(_bm25_corpus)} documents")


def index_chunks(chunks):
    """Index chunks into FAISS and BM25."""
    global _faiss_index, _faiss_id_map, _chunk_metadata, _bm25, _bm25_corpus

    if not chunks:
        return

    import faiss
    from rank_bm25 import BM25Okapi

    # Prepare data
    embeddings = []
    for chunk in chunks:
        if chunk.embedding is None:
            continue

        faiss_idx = len(_faiss_id_map)
        _faiss_id_map[faiss_idx] = chunk.id
        _chunk_metadata[chunk.id] = {
            "text": chunk.text,
            "metadata": chunk.metadata,
        }
        embeddings.append(chunk.embedding)

        # BM25
        _bm25_corpus[chunk.id] = {
            "text": chunk.text,
            "metadata": chunk.metadata,
            "tokens": _tokenize(chunk.text),
        }

    # Build FAISS index
    if embeddings:
        dim = len(embeddings[0])
        vectors = np.array(embeddings, dtype=np.float32)

        if _faiss_index is None:
            _faiss_index = faiss.IndexFlatIP(dim)  # Inner product (cosine after normalization)

        _faiss_index.add(vectors)

    # Rebuild BM25
    if _bm25_corpus:
        tokenized = [doc["tokens"] for doc in _bm25_corpus.values()]
        _bm25 = BM25Okapi(tokenized)

    save_index()
    logger.info(f"Indexed {len(chunks)} chunks")


def remove_product_chunks(product_id: str):
    """Remove all chunks for a product."""
    global _bm25_corpus, _bm25

    ids_to_remove = [
        cid for cid, meta in _chunk_metadata.items()
        if meta.get("metadata", {}).get("product_id") == product_id
    ]

    for cid in ids_to_remove:
        del _chunk_metadata[cid]
        if cid in _bm25_corpus:
            del _bm25_corpus[cid]

    # Rebuild BM25
    if _bm25_corpus:
        from rank_bm25 import BM25Okapi
        tokenized = [doc["tokens"] for doc in _bm25_corpus.values()]
        _bm25 = BM25Okapi(tokenized)

    # Note: FAISS doesn't support efficient deletion
    # We'll rebuild the full index on next sync
    logger.info(f"Removed {len(ids_to_remove)} chunks for product {product_id}")


def search(query: str, top_k: int = 20, filters: dict = None) -> list[dict]:
    """Hybrid search with FAISS + BM25."""
    results = {}

    # FAISS search
    if _faiss_index is not None and _faiss_index.ntotal > 0:
        from core.embedder import encode_query
        query_vec = encode_query(query).reshape(1, -1).astype(np.float32)
        scores, indices = _faiss_index.search(query_vec, min(top_k * 2, _faiss_index.ntotal))

        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            chunk_id = _faiss_id_map.get(idx)
            if chunk_id and chunk_id in _chunk_metadata:
                meta = _chunk_metadata[chunk_id]
                if _matches_filter(meta["metadata"], filters):
                    results[chunk_id] = {
                        "id": chunk_id,
                        "text": meta["text"],
                        "metadata": meta["metadata"],
                        "score": float(score),
                        "source": "faiss",
                    }

    # BM25 search
    if _bm25 is not None:
        query_tokens = _tokenize(query)
        scores = _bm25.get_scores(query_tokens)
        doc_ids = list(_bm25_corpus.keys())

        for doc_id, score in sorted(zip(doc_ids, scores), key=lambda x: -x[1])[:top_k]:
            if score > 0:
                doc = _bm25_corpus[doc_id]
                if _matches_filter(doc["metadata"], filters):
                    if doc_id in results:
                        results[doc_id]["score"] += score  # Combine scores
                    else:
                        results[doc_id] = {
                            "id": doc_id,
                            "text": doc["text"],
                            "metadata": doc["metadata"],
                            "score": score,
                            "source": "bm25",
                        }

    # Sort by combined score
    sorted_results = sorted(results.values(), key=lambda x: -x["score"])
    return sorted_results[:top_k]


def _matches_filter(metadata: dict, filters: dict) -> bool:
    """Check if metadata matches filters."""
    if not filters:
        return True
    for key, value in filters.items():
        if metadata.get(key) != value:
            return False
    return True


def get_stats() -> dict:
    """Get index statistics."""
    return {
        "faiss_vectors": _faiss_index.ntotal if _faiss_index else 0,
        "bm25_documents": len(_bm25_corpus),
        "total_chunks": len(_chunk_metadata),
    }
