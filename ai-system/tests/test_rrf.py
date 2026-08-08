"""
Unit test cho thuật toán Reciprocal Rank Fusion (RRF).
"""
import pytest
from retrieval.hybrid_retriever import rrf_fusion


def test_rrf_fusion_ordering():
    dense_hits = [
        {"id": "doc1", "text": "Laptop Asus ROG RTX 4060", "metadata": {}},
        {"id": "doc2", "text": "Laptop Dell XPS 13", "metadata": {}},
    ]

    bm25_hits = [
        {"id": "doc2", "text": "Laptop Dell XPS 13", "metadata": {}},
        {"id": "doc3", "text": "Laptop HP Omnibook", "metadata": {}},
    ]

    results = rrf_fusion(dense_hits, bm25_hits, k=60, top_k=10)
    assert len(results) == 3

    # doc2 xuất hiện ở rank 1 của BM25 và rank 2 của Dense -> Điểm RRF sẽ cao nhất
    assert results[0].id == "doc2"
