from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union
import os


class Settings(BaseSettings):
    # Core settings
    environment: str = "development"
    debug: bool = False
    database_url: str = "sqlite:///./peoplepay360.db"
    secret_key: str = "change_this_to_a_secure_random_key_in_production"
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
