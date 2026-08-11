"""Admin dashboard API routers."""
from admin.stats import router as stats_router
from admin.products import router as products_router
from admin.chunks import router as chunks_router
from admin.sync import router as sync_router
from admin.config_api import router as config_router
from admin.logs import router as logs_router
from admin.analytics import router as analytics_router

__all__ = [
    "stats_router",
    "products_router",
    "chunks_router",
    "sync_router",
    "config_router",
    "logs_router",
    "analytics_router",
]
