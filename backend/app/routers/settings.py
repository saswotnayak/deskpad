"""User settings CRUD endpoints."""

from fastapi import APIRouter, HTTPException, Depends, status
from app.db.connection import get_db
from app.models.schemas import SettingsResponse, SettingsUpdate, AccountInfo
from app.routers.auth import get_current_account, verify_profile_owner

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(user_id: int = 1, current_account: AccountInfo = Depends(get_current_account)):
    """Retrieve settings for a specific user."""
    db = await get_db()
    await verify_profile_owner(db, user_id, current_account.id)
    
    cursor = await db.execute(
        "SELECT key, value FROM user_settings WHERE user_id = ?",
        (user_id,)
    )
    rows = await cursor.fetchall()
    return SettingsResponse(
        settings={row[0]: row[1] for row in rows}
    )


@router.patch("", response_model=SettingsResponse)
async def update_settings(update: SettingsUpdate, user_id: int = 1, current_account: AccountInfo = Depends(get_current_account)):
    """Update one or more settings for a specific user."""
    db = await get_db()
    await verify_profile_owner(db, user_id, current_account.id)

    for key, value in update.settings.items():
        await db.execute(
            """
            INSERT INTO user_settings (user_id, key, value, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, key) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at
            """,
            (user_id, key, value),
        )
    await db.commit()

    # Return updated settings
    cursor = await db.execute(
        "SELECT key, value FROM user_settings WHERE user_id = ?",
        (user_id,)
    )
    rows = await cursor.fetchall()
    return SettingsResponse(
        settings={row[0]: row[1] for row in rows}
    )
