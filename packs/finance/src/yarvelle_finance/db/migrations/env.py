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

"""Alembic environment configuration for Yarvelle Finance Pack migrations."""

from logging.config import fileConfig
import os
from typing import Optional

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection, create_engine
from sqlalchemy.engine.url import make_url

from yarvelle_core.db.base import Base

# Ensure all finance pack models are registered on Base.metadata
import yarvelle_finance.db.models  # noqa: F401

try:
    from yarvelle_core.db.session import resolve_database_url
except ImportError:
    def resolve_database_url() -> str:
        return os.environ.get("YARVELLE_DATABASE_URL", "sqlite+aiosqlite:///yarvelle.db")

config = context.config

if config.config_file_name is not None and config.attributes.get("configure_logger", True):
    try:
        fileConfig(config.config_file_name, disable_existing_loggers=False)
    except Exception:
        pass

target_metadata = Base.metadata
DEFAULT_VERSION_TABLE = "alembic_version_finance"


def get_sync_url(raw_url: Optional[str] = None) -> str:
    """Translates async database URLs to sync equivalents for Alembic."""
    url_str = raw_url or resolve_database_url()
    parsed = make_url(url_str)
    driver = parsed.drivername
    if "+aiosqlite" in driver:
        driver = "sqlite"
    elif "+asyncpg" in driver:
        driver = "postgresql"
    elif driver.startswith("sqlite+"):
        driver = "sqlite"
    elif driver.startswith("postgresql+"):
        driver = "postgresql"
    return str(parsed.set(drivername=driver))


def run_migrations_offline() -> None:
    """Run migrations in offline mode."""
    url = config.get_main_option("sqlalchemy.url")
    if not url or "yarvelle.db" in url:
        url = get_sync_url()

    output_buffer = config.attributes.get("output_buffer", None)
    version_table = (
        config.attributes.get("version_table")
        or config.get_main_option("version_table", DEFAULT_VERSION_TABLE)
    )

    context.configure(
        url=url,
        output_buffer=output_buffer,
        target_metadata=target_metadata,
        version_table=version_table,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in online mode."""
    connectable = config.attributes.get("connection", None)
    version_table = (
        config.attributes.get("version_table")
        or config.get_main_option("version_table", DEFAULT_VERSION_TABLE)
    )

    if connectable is not None:
        context.configure(
            connection=connectable,
            target_metadata=target_metadata,
            version_table=version_table,
            render_as_batch=True,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()
    else:
        sync_url = get_sync_url(config.get_main_option("sqlalchemy.url"))
        connectable = create_engine(sync_url, poolclass=pool.NullPool)
        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                version_table=version_table,
                render_as_batch=True,
                compare_type=True,
                compare_server_default=True,
            )
            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
