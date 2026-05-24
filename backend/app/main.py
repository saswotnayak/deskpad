"""DeskPad Backend — FastAPI application entry point."""

from contextlib import asynccontextmanager

import structlog
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.connection import init_db, close_db
from app.middleware.logging import LoggingMiddleware
from app.routers import health, settings as settings_router, todos, users, auth, github


# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer()
        if settings.environment == "development"
        else structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    # Startup
    await logger.ainfo(
        "starting",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )
    await init_db()
    await logger.ainfo("database_initialized", path=settings.db_path)

    yield

    # Shutdown
    await close_db()
    await logger.ainfo("shutdown_complete")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging
app.add_middleware(LoggingMiddleware)

# Register routers
app.include_router(health.router)
app.include_router(settings_router.router)
app.include_router(todos.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(github.router)




if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
    )
