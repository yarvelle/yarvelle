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

"""Smoke test for Yarvelle application composition and 3-pack discovery."""

import pytest
from fastapi.testclient import TestClient

from yarvelle.main import build_app
from yarvelle_core.pack.loader import discover_and_load_packs


def test_pack_discovery_all_three_packs():
    """Verifies that discover_and_load_packs discovers health, finance, and kids packs."""
    registry = discover_and_load_packs(enabled_pack_ids=["health", "finance", "kids"])
    assert "health" in registry.packs
    assert "finance" in registry.packs
    assert "kids" in registry.packs

    # Verify health pack is from carefold_health
    health_pack = registry.packs["health"]
    assert health_pack.domain == "health"
    assert len(health_pack.tools) > 0

    # Verify finance pack
    finance_pack = registry.packs["finance"]
    assert finance_pack.domain == "finance"
    assert "finance.*" in finance_pack.owned_scopes or any(s.startswith("finance") for s in finance_pack.owned_scopes)

    # Verify kids pack
    kids_pack = registry.packs["kids"]
    assert kids_pack.domain in ("kids", "education")
    assert any(s.startswith("kids") or s.startswith("education") for s in kids_pack.owned_scopes)


def test_build_app_smoke():
    """Verifies that FastAPI build_app initializes successfully with endpoints."""
    app = build_app()
    with TestClient(app) as client:
        res = client.get("/healthz")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["product"] == "Yarvelle"
        assert "health" in data["packs"]
        assert "finance" in data["packs"]
        assert "kids" in data["packs"]
