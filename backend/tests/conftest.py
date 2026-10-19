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

"""Pytest configuration and global test fixtures for Yarvelle."""

import os
from pathlib import Path
import tempfile
from typing import AsyncIterator, Iterator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from yarvelle.config import settings
from yarvelle.main import build_app
from yarvelle_core.db.base import Base


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment() -> Iterator[None]:
    """Sets up an isolated temporary home directory and environment for tests."""
    with tempfile.TemporaryDirectory(prefix="yarvelle_test_home_") as tmpdir:
        tmp_path = Path(tmpdir)
        old_home = os.environ.get("YARVELLE_HOME")
        os.environ["YARVELLE_HOME"] = str(tmp_path)
        settings.home_dir = tmp_path
        settings.database_url = f"sqlite+aiosqlite:///{tmp_path}/yarvelle_test.db"

        # Ensure subdirs
        (tmp_path / "uploads").mkdir(parents=True, exist_ok=True)
        (tmp_path / "logs").mkdir(parents=True, exist_ok=True)
        (tmp_path / "notes").mkdir(parents=True, exist_ok=True)

        yield

        if old_home is not None:
            os.environ["YARVELLE_HOME"] = old_home
        else:
            os.environ.pop("YARVELLE_HOME", None)


@pytest.fixture
def client() -> Iterator[TestClient]:
    """TestClient fixture with build_app()."""
    app = build_app()
    with TestClient(app) as tc:
        yield tc
