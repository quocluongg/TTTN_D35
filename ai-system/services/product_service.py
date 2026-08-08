"""
Re-export ProductService from services.product_services
"""
# pyrefly: ignore [missing-import]
from services.product_services import ProductService

__all__ = ["ProductService"]
