"""User settings CRUD endpoints."""

from fastapi import APIRouter
from app.db.connection import get_db
from app.models.schemas import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings():
    """Retrieve all user settings."""
    db = await get_db()
    cursor = await db.execute("SELECT key, value FROM settings")
    rows = await cursor.fetchall()
    return SettingsResponse(
        settings={row[0]: row[1] for row in rows}
    )


@router.patch("", response_model=SettingsResponse)
async def update_settings(update: SettingsUpdate):
    """Update one or more user settings."""
    db = await get_db()

    for key, value in update.settings.items():
        await db.execute(
            """
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at
            """,
            (key, value),
        )
    await db.commit()

    # Return updated settings
    cursor = await db.execute("SELECT key, value FROM settings")
    rows = await cursor.fetchall()
    return SettingsResponse(
        settings={row[0]: row[1] for row in rows}
    )
