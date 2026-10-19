# Yarvelle

<!--
  Yarvelle — Personal & Family AI Assistant Application
  Copyright 2026 Spectrayan (https://spectrayan.com)

  Licensed under the PolyForm Noncommercial License 1.0.0 and the
  Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
  Personal and household local use only. Commercial use, hosted service
  offering, rebranding, white-labeling, and redistribution of modified
  forks are prohibited without a written commercial license from Spectrayan.

  Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)
-->

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm_NC_1.0.0-blue.svg)](LICENSE)
[![Python: 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Architecture: Modular Multi-Pack](https://img.shields.io/badge/architecture-modular_multi--pack-purple.svg)](https://spectrayan.com)

**Yarvelle** is a privacy-preserving, local-first personal and family AI assistant application and multi-pack composition runtime. Built by Spectrayan, Yarvelle enables households to seamlessly organize health visits, manage family budgeting and bills, and coordinate education and household routines while preserving strict cryptographic and data-scope isolation.

---

## Key Features

- **Multi-Pack Composition**: Dynamically loads domain packs via Pack API v1:
  - **Health Pack** (`carefold-health`): Clinical visit preparation, formulary search, and health record organization.
  - **Finance Pack** (`yarvelle_finance`): Household budgeting, bill tracking, and read-only statement organization.
  - **Education Pack** (`yarvelle_education`): School assignments, reading logs, and developmental milestones.
  - **Household Pack** (`yarvelle_household`): Household chores, meal planning, activities, family governance, and cross-domain links.
- **Household & Cross-Domain Layer**:
  - Unified chronological timeline with domain-scoped filtering.
  - Dual-scope cross-domain entity linking.
  - Multi-profile family governance with age bands (`child_u13`, `teen_13_17`, `adult`, `older_adult`) and two-guardian approvals.
  - Cross-domain conflict and deadline cluster detection.
  - Scoped data export and cryptographic zero-knowledge shredding.
- **Local-First & Privacy by Design**: All data stays local under envelope encryption (HKDF-SHA256 derived per-scope DEKs), with full support for local LLM inference (Ollama).

---

## Quickstart

### Prerequisites
- Python 3.12+
- (Optional) Ollama running locally

### Installation
```bash
# Clone the repository
git clone https://github.com/yarvelle/yarvelle.git
cd yarvelle

# Set up virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend and dependencies
pip install -e backend/
```

### Running the Application
```bash
yarvelle serve --port 8000
```

---

## License

Yarvelle is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE) and the [Yarvelle Additional Terms](ADDITIONAL-TERMS.md). Personal and household local use only. Commercial use, hosted services, rebranding, and redistribution of modified forks are prohibited without a written commercial license from Spectrayan.