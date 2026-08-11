"""Evaluation module for RAG Chatbot benchmarking."""

from eval.performance_collector import PerformanceCollector
from eval.document_helper import product_to_document, load_products

__all__ = [
    "PerformanceCollector",
    "product_to_document",
    "load_products"
]
