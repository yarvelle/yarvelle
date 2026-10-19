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

"""Yarvelle Command Line Interface (CLI)."""

import argparse
import sys
from yarvelle import __version__
from yarvelle.branding import PRODUCT_NAME
from yarvelle.config import settings
from yarvelle_core.pack.loader import discover_and_load_packs


def main() -> int:
    parser = argparse.ArgumentParser(description=f"{PRODUCT_NAME} CLI")
    parser.add_argument("--version", action="version", version=f"{PRODUCT_NAME} {__version__}")
    subparsers = parser.add_subparsers(dest="command")

    # serve command
    serve_parser = subparsers.add_parser("serve", help="Start Yarvelle server")
    serve_parser.add_argument("--host", default=settings.host, help="Bind host")
    serve_parser.add_argument("--port", type=int, default=settings.port, help="Bind port")

    # packs command
    subparsers.add_parser("packs", help="List discovered and enabled packs")

    args = parser.parse_args()

    if args.command == "serve":
        from yarvelle.main import run
        run()
        return 0
    elif args.command == "packs":
        print(f"{PRODUCT_NAME} Enabled Packs: {settings.enabled_packs}")
        registry = discover_and_load_packs()
        print(f"Discovered Installed Packs ({len(registry.packs)}):")
        for pid, p in registry.packs.items():
            status = "[ENABLED]" if pid in settings.enabled_packs else "[AVAILABLE]"
            print(f"  - {pid} (v{p.version}): {p.name} {status} - scopes: {p.owned_scopes}")
        return 0
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
