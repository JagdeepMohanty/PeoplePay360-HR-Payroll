from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Core settings
    database_url: str = "sqlite:///./peoplepay360.db"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # SMTP (optional)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""

    # PDF storage directory
    pdf_storage_path: str = "./storage/payslips"

    # CORS origins (comma‑separated in env, parsed to list)
    cors_origins: List[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = False

    def __post_init__(self):
        # Ensure storage dir exists at runtime (called after settings instance creation)
        os.makedirs(self.pdf_storage_path, exist_ok=True)

# Instantiate settings; __post_init__ will create storage dir
settings = Settings()

