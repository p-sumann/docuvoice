from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore",
    )

    # App
    app_env: str = "development"
    app_port: int = 8000
    cors_origins: list[str] = ["http://localhost:3000"]
    debug: bool = False

    # Auth — simple API key via X-API-Key header (empty = auth disabled)
    api_key: str = ""

    # Storage: "memory" or "dynamodb"
    storage_backend: str = "memory"

    # AWS
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_session_token: str = ""
    aws_default_region: str = "us-east-1"

    # S3
    s3_bucket_name: str = "docuvoice-uploads"
    s3_presigned_expiry: int = 300

    # DynamoDB
    dynamodb_table_name: str = "docuvoice-main"
    dynamodb_endpoint_url: str | None = None

    # Bedrock reasoning model (Nova Pro for extraction + findings)
    bedrock_model_id: str = "us.amazon.nova-pro-v1:0"

    # Bedrock lite model (Nova Lite for fast classification)
    bedrock_lite_model_id: str = "us.amazon.nova-lite-v1:0"

    # LiveKit
    livekit_url: str = ""
    livekit_api_key: str = ""
    livekit_api_secret: str = ""


settings = Settings()
