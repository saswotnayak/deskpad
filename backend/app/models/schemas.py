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
