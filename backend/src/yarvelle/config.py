# Yarvelle — Personal & Family AI Assistant Application
# Copyright 2026 Spectrayan (https://spectrayan.com)
#
# Licensed under the PolyForm Noncommercial License 1.0.0 and the
# Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
# Personal and household local use only. Commercial use, hosted service
# offering, rebranding, white-labeling, and redistribution of modified
# forks are prohibited without a written commercial license from Spectrayan.
#
# Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)

"""Yarvelle configuration settings via Pydantic Settings."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, List, Optional
from pydantic import Field, PrivateAttr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from yarvelle.branding import (
    DEFAULT_ARGON2_SALT,
    DEFAULT_COOKIE_PREFIX,
    DEFAULT_DB_FILENAME,
    DEFAULT_HOME_DIR,
    DEFAULT_OAUTH_SCHEME,
    ENV_PREFIX,
    KEYRING_SERVICE_NAME,
    PRODUCT_NAME,
    YARVELLE_BRAND_CONFIG,
    BrandConfig,
)
from yarvelle_core.constants.defaults import DEFAULT_CORS_ORIGINS, DEFAULT_HOST, DEFAULT_PORT
from yarvelle_core.constants.models import (
    DEFAULT_MODEL,
    DEFAULT_MODEL_TIMEOUT_SECONDS,
    DEFAULT_OLLAMA_URL,
)
from yarvelle_core.constants.paths import (
    DEFAULT_AUDIT_LOG_FILE,
    DEFAULT_CATALOG_DB,
    DEFAULT_CHECKPOINTS_DB,
    LOGS_DIR,
    NOTES_DIR,
    UPLOADS_DIR,
)


def resolve_yarvelle_home() -> Path:
    """Resolves canonical Yarvelle home directory (~/.yarvelle)."""
    env_home = os.getenv("YARVELLE_HOME") or os.getenv("YARVELLE_HOME_DIR")
    if env_home and env_home.strip():
        return Path(env_home.strip()).expanduser().resolve()
    env_ws = os.getenv("YARVELLE_WORKSPACE_ROOT")
    if env_ws and env_ws.strip():
        ws_path = Path(env_ws.strip()).expanduser().resolve()
        if ws_path.name == DEFAULT_HOME_DIR:
            return ws_path
        if (ws_path / DEFAULT_HOME_DIR).is_dir():
            return (ws_path / DEFAULT_HOME_DIR).resolve()
        return ws_path
    return (Path.home() / DEFAULT_HOME_DIR).resolve()


class Settings(BaseSettings):
    """Product-level configuration for Yarvelle application."""

    model_config = SettingsConfigDict(
        env_prefix="YARVELLE_",
        env_file=".env",
        extra="ignore",
    )

    _brand_config: BrandConfig = PrivateAttr(default_factory=lambda: YARVELLE_BRAND_CONFIG)

    def __setattr__(self, name: str, value: Any) -> None:
        super().__setattr__(name, value)
        try:
            import yarvelle_core.config
            if hasattr(yarvelle_core.config.settings, name):
                setattr(yarvelle_core.config.settings, name, value)
        except Exception:
            pass

    @property
    def brand_config(self) -> BrandConfig:
        return self._brand_config

    @property
    def product_name(self) -> str:
        return self._brand_config.product_name

    @property
    def env_prefix(self) -> str:
        return self._brand_config.env_prefix

    @property
    def home_dir_name(self) -> str:
        return self._brand_config.home_dir_name

    @property
    def db_filename(self) -> str:
        return self._brand_config.db_filename

    @property
    def oauth_scheme(self) -> str:
        return self._brand_config.oauth_scheme

    @property
    def cookie_prefix(self) -> str:
        return self._brand_config.cookie_prefix

    @property
    def default_agent(self) -> str:
        return self._brand_config.default_agent

    workspace_root: Path = Path.cwd().resolve()
    home_dir: Path = Field(default_factory=resolve_yarvelle_home)

    enabled_packs: List[str] = Field(default_factory=lambda: ["health", "finance", "education", "household"])

    host: str = DEFAULT_HOST
    port: int = DEFAULT_PORT

    ollama_url: str = Field(default_factory=lambda: os.getenv("YARVELLE_OLLAMA_URL", DEFAULT_OLLAMA_URL))
    default_model: str = DEFAULT_MODEL
    model_timeout_seconds: float = DEFAULT_MODEL_TIMEOUT_SECONDS

    log_level: str = "INFO"
    log_json: bool = False

    audit_log_path: Optional[Path] = None
    audit_store_bodies: bool = False

    db_path: Optional[Path] = None
    database_url: Optional[str] = None

    memory_backend: str = "sqlite"
    spector_url: str = "http://localhost:7070"
    catalog_db_path: Optional[Path] = None
    memory_fallback_to_sqlite: bool = True

    auth_provider: str = Field(default="local")
    cors_origins: List[str] = list(DEFAULT_CORS_ORIGINS)

    @model_validator(mode="after")
    def _resolve_database_url(self) -> "Settings":
        if not self.database_url:
            env_url = os.getenv("YARVELLE_DATABASE_URL") or os.getenv("DATABASE_URL")
            if env_url and env_url.strip():
                self.database_url = env_url.strip()
            else:
                self.database_url = f"sqlite+aiosqlite:///{self.home_dir}/{self.db_filename}"
        return self

    def get_home_dir(self) -> Path:
        return self.home_dir

    def get_uploads_dir(self) -> Path:
        return self.home_dir / UPLOADS_DIR

    def get_database_url(self) -> str:
        return self.database_url or f"sqlite+aiosqlite:///{self.home_dir}/{self.db_filename}"

    def get_catalog_db_path(self) -> Path:
        return self.catalog_db_path or (self.home_dir / DEFAULT_CATALOG_DB)

    def get_checkpointer_path(self) -> Path:
        return self.db_path or (self.home_dir / DEFAULT_CHECKPOINTS_DB)

    def get_audit_log_path(self) -> Path:
        return self.audit_log_path or (self.home_dir / LOGS_DIR / DEFAULT_AUDIT_LOG_FILE)


settings = Settings()

# Synchronize with yarvelle_core runtime settings
try:
    import yarvelle_core.config
    yarvelle_core.config.settings._brand_config = YARVELLE_BRAND_CONFIG
    for key in (
        "workspace_root",
        "home_dir",
        "database_url",
        "audit_log_path",
        "catalog_db_path",
        "db_path",
        "auth_provider",
        "cors_origins",
    ):
        if hasattr(settings, key) and hasattr(yarvelle_core.config.settings, key):
            setattr(yarvelle_core.config.settings, key, getattr(settings, key))
except Exception:
    pass

__all__ = ["Settings", "settings", "resolve_yarvelle_home"]
