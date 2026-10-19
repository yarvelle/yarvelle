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

"""Yarvelle: Privacy-preserving local-first personal and family AI assistant."""

from __future__ import annotations

import importlib as _importlib
import importlib.abc as _importlib_abc
import importlib.machinery as _machinery
import sys as _sys
from typing import Any

__version__ = "0.1.0"


class _YarvelleAliasLoader(_importlib_abc.Loader):
    def __init__(self, target_mod: Any) -> None:
        self.target_mod = target_mod
        self.orig_spec = getattr(target_mod, "__spec__", None)

    def create_module(self, spec):
        return self.target_mod

    def exec_module(self, module):
        if self.orig_spec is not None:
            try:
                module.__spec__ = self.orig_spec
            except AttributeError:
                pass


class _YarvelleRedirectFinder(_importlib_abc.MetaPathFinder):
    """Redirects `yarvelle_{finance,education,household}` imports to `yarvelle.{finance,education,household}`."""

    _PACK_PREFIXES = {
        "yarvelle_finance": "yarvelle.finance",
        "yarvelle_education": "yarvelle.education",
        "yarvelle_household": "yarvelle.household",
    }

    def find_spec(self, fullname: str, path=None, target=None):
        for old_prefix, new_prefix in self._PACK_PREFIXES.items():
            if fullname == old_prefix or fullname.startswith(old_prefix + "."):
                target_name = new_prefix + fullname[len(old_prefix):]
                try:
                    mod = _importlib.import_module(target_name)
                except ImportError:
                    return None
                is_pkg = hasattr(mod, "__path__")
                spec = _machinery.ModuleSpec(fullname, _YarvelleAliasLoader(mod), is_package=is_pkg)
                if is_pkg:
                    spec.submodule_search_locations = list(mod.__path__)
                return spec
        return None


if not any(type(f).__name__ == "_YarvelleRedirectFinder" for f in _sys.meta_path):
    _sys.meta_path.insert(0, _YarvelleRedirectFinder())

__all__ = ["__version__"]

