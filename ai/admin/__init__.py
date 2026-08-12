"""Admin dashboard API routers."""
from ai.admin.stats import router as stats_router
from ai.admin.products import router as products_router
from ai.admin.chunks import router as chunks_router
from ai.admin.sync import router as sync_router
from ai.admin.config_api import router as config_router
from ai.admin.logs import router as logs_router
from ai.admin.analytics import router as analytics_router

__all__ = [
    "stats_router",
    "products_router",
    "chunks_router",
    "sync_router",
    "config_router",
    "logs_router",
    "analytics_router",
]
