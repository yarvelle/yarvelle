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

"""Cryptographic salt pin and keyring service test for Yarvelle Vault."""

from yarvelle.branding import (
    DEFAULT_ARGON2_SALT,
    KEYRING_KEY_NAME,
    KEYRING_LEGACY_KEY,
    KEYRING_SERVICE_NAME,
)
from yarvelle_core.vault.kek import derive_argon2id_kek


def test_vault_salt_pin_invariants():
    """Verify DEFAULT_ARGON2_SALT is pinned to exactly b'yarvelle_kek_sal' and 16 bytes."""
    assert DEFAULT_ARGON2_SALT == b"yarvelle_kek_sal", (
        "CRITICAL: DEFAULT_ARGON2_SALT has changed! Modifying this constant will "
        "render existing Yarvelle encrypted vaults and profile DEKs permanently unrecoverable!"
    )
    assert len(DEFAULT_ARGON2_SALT) == 16, "Argon2 salt must be exactly 16 bytes."


def test_keyring_service_name_pin():
    """Verify Keyring service and key names."""
    assert KEYRING_SERVICE_NAME == "yarvelle_vault"
    assert KEYRING_KEY_NAME == "kek_master"
    assert KEYRING_LEGACY_KEY == "yarvelle_kek"


def test_argon2id_derivation_deterministic():
    """Verify that Argon2id key derivation using pinned salt is deterministic and 32 bytes."""
    passphrase = "master_household_passphrase_test_123"
    key1 = derive_argon2id_kek(passphrase, salt=DEFAULT_ARGON2_SALT)
    key2 = derive_argon2id_kek(passphrase, salt=DEFAULT_ARGON2_SALT)
    assert len(key1) == 32, "Derived KEK must be exactly 32 bytes."
    assert key1 == key2, "Derivation must be completely deterministic."
