from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union, Optional
import os
import secrets

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_FILE = os.path.join(BACKEND_DIR, "peoplepay360.db").replace("\\", "/")

class Settings(BaseSettings):
    # Core settings
    environment: str = os.getenv("ENVIRONMENT", "development")
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_FILE}")
    secret_key: str = ""
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # SMTP (optional)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    # PDF storage directory
    pdf_storage_path: str = "./storage/payslips"

    # CORS origins
    cors_origins: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("secret_key", mode="before")
    @classmethod
    def validate_secret_key(cls, v: Optional[str]) -> str:
        env = os.getenv("ENVIRONMENT", "development").strip().lower()
        if not v or v.strip() == "" or v.strip() == "test_secret_key":
            if env == "production":
                raise ValueError("CRITICAL SECURITY VIOLATION: Insecure or missing SECRET_KEY in production environment!")
            # Generate a secure random token as a default for local development
            return secrets.token_hex(32)
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[List[str], str]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    def model_post_init(self, __context):
        # Ensure storage dir exists at runtime
        os.makedirs(self.pdf_storage_path, exist_ok=True)


# Instantiate settings singleton
settings = Settings()
