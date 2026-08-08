"""
API Key Authentication Middleware for sync endpoints.
"""
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

from config.settings import get_settings

settings = get_settings()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Verify X-API-Key header against configured RAG_SYNC_API_KEY.

    Raises:
        HTTPException 401: If API key is missing or invalid

    Returns:
        str: The verified API key
    """
    if api_key is None:
        raise HTTPException(
            status_code=401,
            detail="API key missing. Please provide X-API-Key header."
        )
    if api_key != settings.RAG_SYNC_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key."
        )
    return api_key
