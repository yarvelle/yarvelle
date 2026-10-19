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

"""Tests for Yarvelle branding invariants, namespaces, and configuration."""

from yarvelle.branding import (
    DEFAULT_AGENT,
    DEFAULT_COOKIE_PREFIX,
    DEFAULT_DB_FILENAME,
    DEFAULT_HOME_DIR,
    DEFAULT_OAUTH_SCHEME,
    ENV_PREFIX,
    PRODUCT_NAME,
    YARVELLE_BRAND_CONFIG,
)
from yarvelle.config import settings


def test_branding_constants():
    assert PRODUCT_NAME == "Yarvelle"
    assert ENV_PREFIX == "YARVELLE_"
    assert DEFAULT_HOME_DIR == ".yarvelle"
    assert DEFAULT_DB_FILENAME == "yarvelle.db"
    assert DEFAULT_OAUTH_SCHEME == "yarvelle"
    assert DEFAULT_COOKIE_PREFIX == "yarvelle_"
    assert DEFAULT_AGENT == "household-steward"


def test_brand_config_values():
    assert YARVELLE_BRAND_CONFIG.product_name == "Yarvelle"
    assert YARVELLE_BRAND_CONFIG.env_prefix == "YARVELLE_"
    assert YARVELLE_BRAND_CONFIG.home_dir_name == ".yarvelle"
    assert YARVELLE_BRAND_CONFIG.db_filename == "yarvelle.db"
    assert YARVELLE_BRAND_CONFIG.oauth_scheme == "yarvelle"


def test_settings_brand_properties():
    assert settings.product_name == "Yarvelle"
    assert settings.env_prefix == "YARVELLE_"
    assert settings.home_dir_name == ".yarvelle"
    assert settings.db_filename == "yarvelle.db"
    assert settings.oauth_scheme == "yarvelle"
    assert settings.enabled_packs == ["health", "finance", "education", "household"]
