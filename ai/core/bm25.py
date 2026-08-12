"""BM25 lexical search with proper Vietnamese tokenization via pyvi.

Fixes v3's broken regex tokenizer that split Vietnamese words incorrectly.
"""
import logging
import os
import pickle
import re
from typing import List

from rank_bm25 import BM25Okapi

logger = logging.getLogger(__name__)

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_BM25_INDEX_PATH = os.path.join(_BASE_DIR, "data", "processed", "bm25_index.pkl")


def tokenize(text: str) -> List[str]:
    """Tokenize Vietnamese text using pyvi for proper word segmentation.

    Falls back to regex if pyvi unavailable.
    """
    if not text:
        return []
    try:
        from pyvi import ViTokenizer
        return ViTokenizer.tokenize(text.lower()).split()
    except ImportError:
        return re.findall(r"\w+", text.lower())


class BM25Searcher:
    """BM25 lexical search over product corpus."""

    def __init__(self, products: list = None):
        self.products = products or []
        self.bm25 = None
        self.corpus_tokens = []

        # Try loading pre-built index
        if os.path.exists(_BM25_INDEX_PATH):
            try:
                with open(_BM25_INDEX_PATH, "rb") as f:
                    payload = pickle.load(f)
                    self.bm25 = payload.get("bm25")
                    self.corpus_tokens = payload.get("tokenized_corpus", [])
                logger.info(f"[BM25] Loaded pre-built index ({len(self.corpus_tokens)} chunks).")
            except Exception as e:
                logger.warning(f"[BM25] Cannot load pre-built index ({e}), building realtime.")
                self.bm25 = None

        # Fallback: build realtime
        if self.bm25 is None and self.products:
            logger.info(f"[BM25] Building index for {len(self.products)} products...")
            for p in self.products:
                full_text = f"{p.get('name', '')} {p.get('category', '')} {p.get('use_case', '')} {p.get('description', '')}"
                self.corpus_tokens.append(tokenize(full_text))
            self.bm25 = BM25Okapi(self.corpus_tokens)

    def get_scores(self, query: str) -> List[float]:
        """Get normalized BM25 scores for all products."""
        if not self.bm25 or not query.strip():
            return [0.0] * len(self.corpus_tokens)

        query_tokens = tokenize(query)
        if not query_tokens:
            return [0.0] * len(self.corpus_tokens)

        scores = self.bm25.get_scores(query_tokens)
        max_s = max(scores) if len(scores) > 0 and max(scores) > 0 else 1.0
        return [float(s / max_s) for s in scores]
