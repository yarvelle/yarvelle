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

"""Every pack route is mounted at /api/v1/<pack>/... behind core's auth + scope guard."""

from __future__ import annotations

from fastapi.testclient import TestClient
import pytest

from yarvelle.main import build_app
from yarvelle_core.api.scope_guard import iter_api_routes, route_scope_guards
from yarvelle_core.config import settings as core_settings

PACK_ROUTE_PREFIXES = (
    "/api/v1/finance/",
    "/api/v1/education/",
    "/api/v1/household/chores",
    "/api/v1/household/meals",
    "/api/v1/household/activities",
)

EXPECTED_PACK_PATHS = {
    "/api/v1/finance/accounts",
    "/api/v1/finance/transactions",
    "/api/v1/finance/bills",
    "/api/v1/finance/budget",
    "/api/v1/education/assignments",
    "/api/v1/education/milestones",
    "/api/v1/education/reading",
    "/api/v1/education/forms",
    "/api/v1/household/chores",
    "/api/v1/household/meals",
    "/api/v1/household/activities",
}


def _pack_routes(app):
    return [r for r in iter_api_routes(app.routes) if r.path.startswith(PACK_ROUTE_PREFIXES)]


def test_route_inventory_all_pack_routes_guarded() -> None:
    app = build_app()
    routes = _pack_routes(app)
    assert {r.path for r in routes} >= EXPECTED_PACK_PATHS
    for route in routes:
        guards = route_scope_guards(route)
        assert guards, f"{sorted(route.methods)} {route.path} is mounted without a scope guard"
        scope = guards[0][0]
        assert route.path.split("/")[3] == scope.split(".")[0], (route.path, scope)


def test_no_doubled_api_prefix() -> None:
    app = build_app()
    doubled = [r.path for r in iter_api_routes(app.routes) if "/api/v1/api/" in r.path or r.path.startswith("/api/api/")]
    assert doubled == []


@pytest.mark.parametrize("path", sorted(EXPECTED_PACK_PATHS))
def test_unauthenticated_pack_reads_are_rejected(monkeypatch, path) -> None:
    monkeypatch.setattr(core_settings, "auth_provider", "local")
    with TestClient(build_app()) as client:
        response = client.get(path, params={"profile_id": "victim-profile"})
    assert response.status_code == 401, response.text
