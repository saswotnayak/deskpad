"""Database connection and migration management."""

import aiosqlite
import os
from pathlib import Path

from app.config import settings

_db: aiosqlite.Connection | None = None


async def get_db() -> aiosqlite.Connection:
    """Get the database connection (singleton)."""
    global _db
    if _db is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _db


async def init_db() -> None:
    """Initialize database connection and run migrations."""
    global _db

    # Ensure data directory exists
    db_dir = os.path.dirname(settings.db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    _db = await aiosqlite.connect(settings.db_path)
    _db.row_factory = aiosqlite.Row

    # Enable WAL mode for better concurrent read performance
    await _db.execute("PRAGMA journal_mode=WAL")
    await _db.execute("PRAGMA foreign_keys=ON")

    # Run migrations
    await _run_migrations(_db)


async def close_db() -> None:
    """Close the database connection."""
    global _db
    if _db is not None:
        await _db.close()
        _db = None


async def _run_migrations(db: aiosqlite.Connection) -> None:
    """Run SQL migration files in order."""
    migrations_dir = Path(__file__).parent / "migrations"
    if not migrations_dir.exists():
        return

    # Track applied migrations
    await db.execute(
        """
        CREATE TABLE IF NOT EXISTS _migrations (
            filename TEXT PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    await db.commit()

    # Get already-applied migrations
    cursor = await db.execute("SELECT filename FROM _migrations")
    applied = {row[0] for row in await cursor.fetchall()}

    # Apply new migrations in order
    migration_files = sorted(migrations_dir.glob("*.sql"))
    for migration_file in migration_files:
        if migration_file.name not in applied:
            sql = migration_file.read_text()
            await db.executescript(sql)
            await db.execute(
                "INSERT INTO _migrations (filename) VALUES (?)",
                (migration_file.name,),
            )
            await db.commit()
