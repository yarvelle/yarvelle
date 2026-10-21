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

"""Household membership authorization (YV-FAM-1..3): no cross-household access or escalation."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterator, Tuple
import uuid

from fastapi import HTTPException, Request
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from yarvelle.config import settings
from yarvelle.main import build_app
from yarvelle_core.api.deps import get_current_user
from yarvelle_core.auth.ports import UserProfile
from yarvelle_core.config import settings as core_settings
from yarvelle_core.db.models import Profile, ProfileAccess, User


def _user(user_id: str) -> UserProfile:
    now = datetime.now(timezone.utc)
    return UserProfile(id=user_id, email=f"{user_id}@example.test", username=user_id, created_at=now, updated_at=now)


@pytest.fixture
def ctx(monkeypatch) -> Iterator[Tuple[TestClient, dict]]:
    monkeypatch.setattr(core_settings, "auth_provider", "local")
    app = build_app()

    async def _fake_user(request: Request) -> UserProfile:
        uid = request.headers.get("X-Test-User")
        if not uid:
            raise HTTPException(status_code=401, detail="Authentication required")
        return _user(uid)

    app.dependency_overrides[get_current_user] = _fake_user
    suffix = uuid.uuid4().hex[:8]
    ids = {name: f"{name}-{suffix}" for name in ("alice", "bob", "dan", "vera")}
    profiles = {name: f"p-{name}-{suffix}" for name in ("alice", "bob", "dan")}
    with TestClient(app) as client:
        engine = create_engine(settings.database_url.replace("+aiosqlite", ""))
        owner = {"alice": ids["alice"], "bob": ids["bob"], "dan": ids["alice"]}
        with Session(engine) as session:
            session.add_all(
                [User(id=uid, email=f"{uid}@example.test", username=uid, hashed_password="x") for uid in ids.values()]
            )
            session.flush()
            session.add_all(
                [Profile(id=pid, user_id=owner[name], name=name, is_primary=name != "dan") for name, pid in profiles.items()]
            )
            # vera holds a read-only grant on alice's profile.
            session.add(
                ProfileAccess(
                    profile_id=profiles["alice"],
                    user_id=ids["vera"],
                    granted_by=ids["alice"],
                    role="viewer",
                    access_level="view",
                    granted_at=datetime.now(timezone.utc),
                )
            )
            session.commit()
        engine.dispose()
        yield client, {"users": ids, "profiles": profiles}


def _h(uid: str) -> dict:
    return {"X-Test-User": uid}


def test_household_isolation_and_admin_only_mutations(ctx) -> None:
    client, data = ctx
    alice, bob, dan = (data["users"][k] for k in ("alice", "bob", "dan"))
    p = data["profiles"]

    created = client.post("/api/v1/household", json={"name": "Alice home"}, headers=_h(alice))
    assert created.status_code == 201, created.text
    hh_id = created.json()["id"]

    members = client.get(f"/api/v1/household/{hh_id}/members", headers=_h(alice)).json()
    assert [(m["profile_id"], m["role"], m["user_id"]) for m in members] == [(p["alice"], "admin", alice)]

    # Outsider: cannot see, enumerate, join or reconfigure the household.
    assert hh_id not in {h["id"] for h in client.get("/api/v1/household", headers=_h(bob)).json()}
    assert client.get(f"/api/v1/household/{hh_id}", headers=_h(bob)).status_code == 404
    assert client.get(f"/api/v1/household/{hh_id}/members", headers=_h(bob)).status_code == 404
    assert all(m["household_id"] != hh_id for m in client.get("/api/v1/household/members", headers=_h(bob)).json())
    self_join = client.post(
        f"/api/v1/household/{hh_id}/members",
        json={"profile_id": p["bob"], "user_id": bob, "role": "admin"},
        headers=_h(bob),
    )
    assert self_join.status_code == 404
    assert client.patch(f"/api/v1/household/{hh_id}/toggles", json={"finance": False}, headers=_h(bob)).status_code == 404

    # Admin cannot pull in a profile they do not manage.
    foreign = client.post(f"/api/v1/household/{hh_id}/members", json={"profile_id": p["bob"]}, headers=_h(alice))
    assert foreign.status_code == 403

    # Admin adds a managed profile linked to a login as a plain member.
    added = client.post(
        f"/api/v1/household/{hh_id}/members",
        json={"profile_id": p["dan"], "user_id": dan, "role": "member"},
        headers=_h(alice),
    )
    assert added.status_code == 201, added.text

    # Plain member can read but not escalate or reconfigure.
    assert client.get(f"/api/v1/household/{hh_id}", headers=_h(dan)).status_code == 200
    escalate = client.post(
        f"/api/v1/household/{hh_id}/members",
        json={"profile_id": p["dan"], "user_id": dan, "role": "admin"},
        headers=_h(dan),
    )
    assert escalate.status_code == 403
    assert client.patch(f"/api/v1/household/{hh_id}/toggles", json={"finance": False}, headers=_h(dan)).status_code == 403
    assert client.patch(f"/api/v1/household/{hh_id}/toggles", json={"finance": False}, headers=_h(alice)).json()["finance"] is False


def test_static_household_paths_are_not_shadowed(ctx) -> None:
    client, data = ctx
    response = client.get("/api/v1/household/members", headers=_h(data["users"]["alice"]))
    assert response.status_code == 200
    assert response.json() == []


def test_cross_domain_views_and_data_operations_require_authorization(ctx) -> None:
    client, data = ctx
    alice, bob, dan, vera = (data["users"][k] for k in ("alice", "bob", "dan", "vera"))
    p = data["profiles"]
    hh_id = client.post("/api/v1/household", json={"name": "Alice home"}, headers=_h(alice)).json()["id"]
    added = client.post(
        f"/api/v1/household/{hh_id}/members",
        json={"profile_id": p["dan"], "user_id": dan, "role": "member"},
        headers=_h(alice),
    )
    assert added.status_code == 201, added.text
    link_body = {
        "source_domain": "health",
        "source_entity_type": "appointment",
        "source_entity_id": "a-1",
        "target_domain": "finance",
        "target_entity_type": "bill",
        "target_entity_id": "b-1",
        "link_type": "billed_by",
        "profile_id": p["alice"],
    }

    # Timeline: outsiders cannot read another household or profile, and must name a target.
    assert client.get(f"/api/v1/household/timeline?household_id={hh_id}", headers=_h(bob)).status_code == 404
    assert client.get(f"/api/v1/household/timeline?profile_id={p['alice']}", headers=_h(bob)).status_code == 404
    assert client.get("/api/v1/household/timeline", headers=_h(bob)).status_code == 400
    assert client.get(f"/api/v1/household/timeline?household_id={hh_id}", headers=_h(dan)).status_code == 200
    assert client.get(f"/api/v1/household/timeline?profile_id={p['alice']}", headers=_h(vera)).status_code == 200

    # Links: write needs write access to the profile; listing and deleting are profile-bound.
    assert client.post("/api/v1/household/links", json=link_body, headers=_h(bob)).status_code == 404
    assert client.post("/api/v1/household/links", json=link_body, headers=_h(vera)).status_code == 403
    created = client.post("/api/v1/household/links", json=link_body, headers=_h(alice))
    assert created.status_code == 201, created.text
    link_id = created.json()["id"]
    assert client.get("/api/v1/household/links", headers=_h(bob)).status_code == 400
    assert client.get(f"/api/v1/household/links?profile_id={p['alice']}", headers=_h(bob)).status_code == 404
    assert client.get(f"/api/v1/household/links?profile_id={p['alice']}", headers=_h(vera)).status_code == 200
    assert client.get(f"/api/v1/household/links?profile_id={p['alice']}", headers=_h(alice)).status_code == 200
    assert client.delete(f"/api/v1/household/links/{link_id}", headers=_h(bob)).status_code == 404
    assert client.delete(f"/api/v1/household/links/{link_id}", headers=_h(vera)).status_code == 403
    assert client.delete(f"/api/v1/household/links/{link_id}", headers=_h(alice)).status_code == 204

    # Conflicts: household members only.
    assert client.get(f"/api/v1/household/conflicts?household_id={hh_id}", headers=_h(bob)).status_code == 404
    assert client.get(f"/api/v1/household/conflicts?household_id={hh_id}", headers=_h(dan)).status_code == 200

    # Export: household admin or profile manager only.
    export_q = "include_files=false"
    assert client.get(f"/api/v1/household/export?household_id={hh_id}&{export_q}", headers=_h(bob)).status_code == 404
    assert client.get(f"/api/v1/household/export?household_id={hh_id}&{export_q}", headers=_h(dan)).status_code == 403
    assert client.get(f"/api/v1/household/export?profile_id={p['alice']}&{export_q}", headers=_h(vera)).status_code == 403
    assert client.get(f"/api/v1/household/export?{export_q}", headers=_h(bob)).status_code == 400
    assert client.get(f"/api/v1/household/export?household_id={hh_id}&{export_q}", headers=_h(alice)).status_code == 200

    # Purge and shred: only a full manager of the profile.
    purge = {"profile_id": p["alice"], "domain": "finance"}
    assert client.post("/api/v1/household/purge/domain", json=purge, headers=_h(bob)).status_code == 404
    assert client.post("/api/v1/household/purge/domain", json=purge, headers=_h(vera)).status_code == 403
    assert client.delete(f"/api/v1/household/shred/{p['alice']}", headers=_h(bob)).status_code == 404
    assert client.delete(f"/api/v1/household/shred/{p['alice']}", headers=_h(vera)).status_code == 403
    assert client.post("/api/v1/household/purge/domain", json=purge, headers=_h(alice)).status_code == 200
