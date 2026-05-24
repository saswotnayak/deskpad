"""Router for user profile management."""

import sqlite3
from fastapi import APIRouter, HTTPException, Depends, status
from app.db.connection import get_db
from app.models.schemas import UserListResponse, UserProfile, UserCreate, AccountInfo
from app.routers.auth import get_current_account

router = APIRouter(prefix="/api/users", tags=["users"])

DEFAULT_USER_SETTINGS = {
    "clock_mode": "analog",
    "time_format": "24h",
    "week_starts_on": "1",
    "show_week_numbers": "false",
}


@router.get("", response_model=UserListResponse)
async def list_users(current_account: AccountInfo = Depends(get_current_account)):
    """Retrieve all user profiles belonging to the authenticated account."""
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, name, avatar_color FROM users WHERE account_id = ? ORDER BY id ASC",
        (current_account.id,)
    )
    rows = await cursor.fetchall()
    return UserListResponse(
        users=[
            UserProfile(id=row[0], name=row[1], avatar_color=row[2])
            for row in rows
        ]
    )


@router.post("", response_model=UserProfile)
async def create_user(user_in: UserCreate, current_account: AccountInfo = Depends(get_current_account)):
    """Create a new user profile under the authenticated account and initialize default settings."""
    db = await get_db()
    name_stripped = user_in.name.strip()
    if not name_stripped:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User name cannot be empty"
        )

    try:
        # 1. Insert user
        cursor = await db.execute(
            "INSERT INTO users (name, avatar_color, account_id) VALUES (?, ?, ?)",
            (name_stripped, user_in.avatar_color, current_account.id)
        )
        user_id = cursor.lastrowid
        
        # 2. Seed settings for the new user
        for key, value in DEFAULT_USER_SETTINGS.items():
            await db.execute(
                "INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)",
                (user_id, key, value)
            )
            
        await db.commit()
        return UserProfile(id=user_id, name=name_stripped, avatar_color=user_in.avatar_color)
    except sqlite3.IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with name '{name_stripped}' already exists"
        )


@router.delete("/{user_id}")
async def delete_user(user_id: int, current_account: AccountInfo = Depends(get_current_account)):
    """Delete a user profile belonging to the authenticated account."""
    db = await get_db()
    
    # Verify profile exists and belongs to the account
    cursor = await db.execute(
        "SELECT id, account_id FROM users WHERE id = ?", (user_id,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
        
    p_id, p_account_id = row
    if p_account_id != current_account.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this profile"
        )

    # Prevent deleting the last profile
    cursor = await db.execute(
        "SELECT COUNT(*) FROM users WHERE account_id = ?", (current_account.id,)
    )
    count_row = await cursor.fetchone()
    if count_row and count_row[0] <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must keep at least one profile"
        )

    await db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    await db.commit()
    return {"success": True}
