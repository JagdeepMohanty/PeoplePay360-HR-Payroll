from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import os

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_FILE = os.path.join(BACKEND_DIR, "peoplepay360.db").replace("\\", "/")

class Settings(BaseSettings):
    # Core settings
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_FILE}")
    secret_key: str = "test_secret_key"
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
