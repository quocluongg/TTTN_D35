"""Off-topic gate: reject non-electronics queries early using embedding similarity."""
import logging
from typing import Tuple

from ai.core.embeddings import PGVectorSearcher

logger = logging.getLogger(__name__)


class OffTopicGate:
    """Reject queries unrelated to electronics using embedding similarity."""

    def __init__(self, embeddings: PGVectorSearcher, threshold: float = 0.48):
        self.embeddings = embeddings
        self.threshold = threshold

    def is_off_topic(self, query: str) -> Tuple[bool, float]:
        """Check if query is off-topic.

        Returns:
            (is_off_topic, max_similarity)
        """
        if not query.strip():
            return False, 0.0

        try:
            query_vec = self.embeddings.encode_query(query)
            max_sim = self.embeddings.max_similarity(query_vec)
            return max_sim < self.threshold, max_sim
        except Exception as e:
            logger.warning(f"[OffTopic] Check failed ({e}), allowing query.")
            return False, 0.0
