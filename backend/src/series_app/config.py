from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://series:series@localhost:5432/series_atlas"
    ai_provider: Literal["ollama", "huggingface"] = "ollama"
    hf_token: str | None = None
    hf_model: str = "Qwen/Qwen3-4B-Instruct-2507"
    ollama_model: str = "qwen2.5:3b"
    ollama_base_url: str = "http://localhost:11434"
    os_security_key: str = "local-only-change-this-key"
    cookie_secure: bool = False
    tvmaze_base_url: str = "https://api.tvmaze.com"
    frontend_url: str = "http://localhost:7777,http://127.0.0.1:7777"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
