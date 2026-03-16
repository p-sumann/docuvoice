from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AgentSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # App
    app_env: str = Field(default="development", alias="APP_ENV")

    # LiveKit (also auto-read by SDK from env)
    livekit_url: str = Field(default="", alias="LIVEKIT_URL")
    livekit_api_key: str = Field(default="", alias="LIVEKIT_API_KEY")
    livekit_api_secret: str = Field(default="", alias="LIVEKIT_API_SECRET")

    # AWS
    aws_access_key_id: str = Field(default="", alias="AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str = Field(default="", alias="AWS_SECRET_ACCESS_KEY")
    aws_session_token: str = Field(default="", alias="AWS_SESSION_TOKEN")
    aws_default_region: str = Field(default="us-east-1", alias="AWS_DEFAULT_REGION")

    # Shared resources
    s3_bucket_name: str = Field(default="docuvoice-uploads", alias="S3_BUCKET_NAME")
    dynamodb_table_name: str = Field(default="docuvoice-main", alias="DYNAMODB_TABLE_NAME")

    # Nova Sonic 2
    nova_sonic_voice: str = Field(default="tiffany", alias="NOVA_SONIC_VOICE")
    nova_sonic_turn_detection: Literal["HIGH", "MEDIUM", "LOW"] = Field(
        default="MEDIUM", alias="NOVA_SONIC_TURN_DETECTION"
    )

    # Limits
    max_context_tokens: int = 4_000
    max_tool_steps: int = 5

    # Backend API (for MVP context loading when S3 not available)
    backend_url: str = Field(default="http://localhost:8000", alias="BACKEND_URL")


@lru_cache
def get_settings() -> AgentSettings:
    return AgentSettings()
