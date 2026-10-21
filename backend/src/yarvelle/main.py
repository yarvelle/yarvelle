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

"""Yarvelle FastAPI Application Composition Root."""

from __future__ import annotations

from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path
from typing import AsyncIterator, List, Optional, Sequence
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import yaml

from yarvelle import __version__
from yarvelle.branding import PRODUCT_NAME
from yarvelle.config import settings
from yarvelle_core.api.http_security import build_cors_options, enforce_bind_safety
from yarvelle_core.api.router import get_default_router_contributions, mount_router_contributions
from yarvelle_core.constants.api import API_PREFIX, API_V1_PREFIX
from yarvelle_core.constants.defaults import DEFAULT_HOST, DEFAULT_PORT
from yarvelle_core.db.session import close_db, init_db
from yarvelle_core.logging import configure_logging, get_logger
from yarvelle_core.pack.loader import LoadedPacksRegistry, discover_and_load_packs

configure_logging()
logger = get_logger("yarvelle.main")


def load_config_file(config_path: Optional[Path] = None) -> dict:
    """Loads configuration options from yarvelle.yaml if present."""
    candidate = config_path or (Path.cwd() / "yarvelle.yaml")
    if candidate.is_file():
        try:
            data = yaml.safe_load(candidate.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                return data
        except Exception as e:
            logger.warning("failed_to_parse_yarvelle_yaml", error=str(e), path=str(candidate))
    return {}


INSECURE_BIND_OVERRIDE_ENV = "YARVELLE_ALLOW_UNAUTHENTICATED_NETWORK_BIND"


def check_host_binding_security(host: str, auth_provider: Optional[str] = None) -> None:
    """Refuses to start when auth is disabled on a non-loopback bind (explicit override only)."""
    enforce_bind_safety(
        (host or DEFAULT_HOST).strip(),
        auth_provider or getattr(settings, "auth_provider", "local"),
        override_env=INSECURE_BIND_OVERRIDE_ENV,
        product="Yarvelle",
    )


def build_app(
    config_file: Optional[Path] = None,
    enabled_pack_ids: Optional[Sequence[str]] = None,
) -> FastAPI:
    """Composes and returns the complete Yarvelle FastAPI application."""
    yaml_config = load_config_file(config_file)
    active_packs = (
        list(enabled_pack_ids)
        if enabled_pack_ids is not None
        else yaml_config.get("packs", {}).get("enabled", settings.enabled_packs)
    )

    loaded_packs: LoadedPacksRegistry = LoadedPacksRegistry()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        nonlocal loaded_packs
        active_host = os.getenv("YARVELLE_HOST") or os.getenv("HOST") or settings.host or DEFAULT_HOST
        check_host_binding_security(active_host, settings.auth_provider)

        logger.info(
            "starting_yarvelle_app",
            version=__version__,
            product=PRODUCT_NAME,
            home_dir=str(settings.home_dir),
            enabled_packs=active_packs,
        )

        # 1. Discover and load enabled domain packs via yarvelle.packs entry points
        try:
            loaded_packs = discover_and_load_packs(enabled_pack_ids=active_packs)
            logger.info("packs_loaded_successfully", packs=list(loaded_packs.packs.keys()))
        except Exception as pack_err:
            logger.error("failed_to_load_packs", error=str(pack_err), exc_info=True)
            raise

        # 2. Initialize relational database and schema
        await init_db()

        yield

        # 3. Teardown
        await close_db()
        logger.info("yarvelle_shutdown_complete")

    app = FastAPI(
        title=PRODUCT_NAME,
        description="Privacy-preserving local-first personal and family AI assistant",
        version=__version__,
        lifespan=lifespan,
    )

    # Configure CORS
    app.add_middleware(CORSMiddleware, **build_cors_options(settings.cors_origins))

    # Mount Master Composite Router
    master_router = APIRouter()

    # Core contributions, then pack contributions. mount_router_contributions
    # mounts every pack router behind core's auth + scope guard and refuses
    # unguarded or absolute-prefix contributions, so failures here are fatal.
    mount_router_contributions(master_router, get_default_router_contributions())

    pack_registry = discover_and_load_packs(enabled_pack_ids=active_packs)
    mount_router_contributions(master_router, pack_registry.router_contributions)

    # Household & cross-domain router (Step Y3); endpoints enforce membership.
    from yarvelle.household.router import router as household_router

    master_router.include_router(household_router, prefix="/household", tags=["Household"])

    app.include_router(master_router, prefix=API_V1_PREFIX)
    app.include_router(master_router, prefix=API_PREFIX, include_in_schema=False)

    # Health check routes
    @app.get("/healthz", include_in_schema=False)
    @app.get("/api/health", include_in_schema=False)
    async def root_health():
        return {
            "status": "healthy",
            "product": PRODUCT_NAME,
            "version": __version__,
            "packs": active_packs,
        }

    return app


app = build_app()


def run() -> None:
    """Runs the server using uvicorn."""
    host = os.getenv("YARVELLE_HOST") or os.getenv("HOST") or settings.host or DEFAULT_HOST
    port_str = os.getenv("YARVELLE_PORT") or os.getenv("PORT") or str(settings.port or DEFAULT_PORT)
    port = int(port_str) if port_str.isdigit() else DEFAULT_PORT
    check_host_binding_security(host, settings.auth_provider)
    uvicorn.run("yarvelle.main:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    run()
