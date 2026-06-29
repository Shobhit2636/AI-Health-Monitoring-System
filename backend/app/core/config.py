from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "demo_secret_key_for_sandbox_32chars_ok"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: List[str] = ["*"]

    DATABASE_URL: str = "sqlite+aiosqlite:///./health_demo.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    CACHE_TTL: int = 300

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "demo-bucket"
    AWS_REGION: str = "us-east-1"

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
