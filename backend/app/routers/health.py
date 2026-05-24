"""Health check endpoint for monitoring and Docker health checks."""

import time
from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api", tags=["health"])

_start_time = time.time()


@router.get("/health")
async def health_check():
    """Return service health status, uptime, and version."""
    uptime_seconds = int(time.time() - _start_time)
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "uptime": f"{hours}h {minutes}m {seconds}s",
        "uptime_seconds": uptime_seconds,
    }
