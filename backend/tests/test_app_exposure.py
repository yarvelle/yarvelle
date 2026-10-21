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

"""Application exposure: CORS allowlist and unauthenticated network-bind refusal."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from yarvelle_core.api.http_security import InsecureBindError

from yarvelle.config import settings as app_settings
from yarvelle.main import INSECURE_BIND_OVERRIDE_ENV, build_app


def test_cors_allows_configured_origin_only() -> None:
    with TestClient(build_app()) as client:
        ok = client.get("/api/v1/health", headers={"Origin": "http://localhost:3000"})
        assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
        evil = client.get("/api/v1/health", headers={"Origin": "http://evil.example.test"})
        assert "access-control-allow-origin" not in evil.headers
        preflight = client.options(
            "/api/v1/health",
            headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "TRACE"},
        )
        assert preflight.status_code == 400


def test_refuses_unauthenticated_start_on_network_interface(monkeypatch) -> None:
    monkeypatch.setattr(app_settings, "auth_provider", "disabled")
    monkeypatch.setenv("YARVELLE_HOST", "0.0.0.0")
    monkeypatch.delenv(INSECURE_BIND_OVERRIDE_ENV, raising=False)
    with pytest.raises(InsecureBindError):
        with TestClient(build_app()):
            pass


def test_explicit_override_allows_unauthenticated_network_start(monkeypatch) -> None:
    monkeypatch.setattr(app_settings, "auth_provider", "disabled")
    monkeypatch.setenv("YARVELLE_HOST", "0.0.0.0")
    monkeypatch.setenv(INSECURE_BIND_OVERRIDE_ENV, "1")
    with TestClient(build_app()) as client:
        assert client.get("/api/v1/health").status_code in (200, 404)
