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

"""Dynamic loose-coupling model resolver for cross-domain queries."""

from __future__ import annotations

import importlib
import sys
from typing import Any, Optional


def resolve_optional_model(
    table_name: str,
    class_name: str,
    module_path: str = "carefold_health.models",
) -> Optional[Any]:
    """Dynamically resolves an optional model class without static import coupling."""
    try:
        from yarvelle_core.db.base import Base

        for mapper in getattr(Base.registry, "mappers", []):
            if getattr(mapper.persist_selectable, "name", None) == table_name:
                return mapper.class_
    except Exception:
        pass

    for mod_name in (module_path, module_path.replace(".models", ".db.models")):
        if mod_name in sys.modules:
            cls = getattr(sys.modules[mod_name], class_name, None)
            if cls is not None:
                return cls

    try:
        mod = importlib.import_module(module_path)
        return getattr(mod, class_name, None)
    except Exception:
        return None
