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

"""Yarvelle Branding, Namespace Configuration, and Cryptographic Invariants."""

from __future__ import annotations

from typing import Final
from yarvelle_core.config import BrandConfig

# Product Branding & Namespace Identifiers
PRODUCT_NAME: Final[str] = "Yarvelle"
ENV_PREFIX: Final[str] = "YARVELLE_"
DEFAULT_HOME_DIR: Final[str] = ".yarvelle"
DEFAULT_DB_FILENAME: Final[str] = "yarvelle.db"
DEFAULT_OAUTH_SCHEME: Final[str] = "yarvelle"
DEFAULT_COOKIE_PREFIX: Final[str] = "yarvelle_"
DEFAULT_AGENT: Final[str] = "household-steward"

# Cryptographic and Keyring Service Invariants
KEYRING_SERVICE_NAME: Final[str] = "yarvelle_vault"
KEYRING_KEY_NAME: Final[str] = "kek_master"
KEYRING_LEGACY_KEY: Final[str] = "yarvelle_kek"

# Argon2id Salt Pinning (Exactly 16 bytes / 128 bits)
DEFAULT_ARGON2_SALT: Final[bytes] = b"yarvelle_kek_sal"

# Canonical BrandConfig instance passed to yarvelle_core
YARVELLE_BRAND_CONFIG: Final[BrandConfig] = BrandConfig(
    product_name=PRODUCT_NAME,
    env_prefix=ENV_PREFIX,
    home_dir_name=DEFAULT_HOME_DIR,
    db_filename=DEFAULT_DB_FILENAME,
    oauth_scheme=DEFAULT_OAUTH_SCHEME,
    cookie_prefix=DEFAULT_COOKIE_PREFIX,
    default_agent=DEFAULT_AGENT,
)

__all__ = [
    "PRODUCT_NAME",
    "ENV_PREFIX",
    "DEFAULT_HOME_DIR",
    "DEFAULT_DB_FILENAME",
    "DEFAULT_OAUTH_SCHEME",
    "DEFAULT_COOKIE_PREFIX",
    "DEFAULT_AGENT",
    "KEYRING_SERVICE_NAME",
    "KEYRING_KEY_NAME",
    "KEYRING_LEGACY_KEY",
    "DEFAULT_ARGON2_SALT",
    "YARVELLE_BRAND_CONFIG",
]
