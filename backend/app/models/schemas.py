"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel


class SettingsResponse(BaseModel):
    """Response containing all user settings."""
    settings: dict[str, str]


class SettingsUpdate(BaseModel):
    """Request body for updating settings."""
    settings: dict[str, str]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "settings": {
                        "clock_mode": "digital",
                        "time_format": "12h",
                    }
                }
            ]
        }
    }


class UserProfile(BaseModel):
    """Schema representing a user profile."""
    id: int
    name: str
    avatar_color: str


class UserCreate(BaseModel):
    """Schema for creating a new user profile."""
    name: str
    avatar_color: str


class UserListResponse(BaseModel):
    """Response containing list of all profiles."""
    users: list[UserProfile]


class OTPSendRequest(BaseModel):
    """Request body to send OTP."""
    email: str


class OTPVerifyRequest(BaseModel):
    """Request body to verify OTP."""
    email: str
    code: str


class AccountInfo(BaseModel):
    """Schema representing account info."""
    id: int
    email: str


class AuthResponse(BaseModel):
    """Response containing access token and account info."""
    token: str
    account: AccountInfo


