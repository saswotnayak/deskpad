from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server
    environment: str = "development"
    port: int = 3001
    host: str = "0.0.0.0"

    # Database
    db_path: str = "./data/deskpad.db"

    # CORS — allow local network access
    cors_origins: list[str] = ["*"]

    # App metadata
    app_name: str = "DeskPad"
    app_version: str = "1.0.0"

    # Todoist Integration
    todoist_api_token: str | None = None

    # GitHub Integration
    github_cache_minutes: int = 60

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
