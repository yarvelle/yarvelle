# Contributing to Yarvelle

Thank you for your interest in contributing to Yarvelle! Yarvelle is a source-available, local-first personal and family AI assistant application and multi-pack runtime built by Spectrayan.

---

## Code of Conduct

All contributors and maintainers are expected to adhere to the [Yarvelle Code of Conduct](CODE_OF_CONDUCT.md) (Contributor Covenant v2.1).

---

## Development Setup

### Prerequisites

- **Python**: `3.12` or higher
- **Git**: Configured with your real name and email
- **Ollama** (optional, recommended for local inference): [ollama.com](https://ollama.com) with `llama3.2` or `mistral`

### Initial Repository Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yarvelle/yarvelle.git
   cd yarvelle
   ```

2. **Set up the virtual environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -e backend/
   ```

3. **Run tests**:
   ```bash
   pytest backend/tests/ -v
   ```

---

## Contribution Guidelines

1. **Safety First**: Any modifications affecting child protection (COPPA, non-ranking), financial non-advisory boundaries, or clinical red flags must be rigorously verified.
2. **License Headers**: All Python files must include the standard Yarvelle license header. Run `python3 scripts/check_licenses.py` to verify.
3. **No Duplicate Code**: Yarvelle is a composition application. Core primitives belong in `yarvelle-core`, health logic in `carefold-health`, and household features in `src/yarvelle/household/` or domain packs.
4. **Contributor License Agreement**: All contributors must agree to the [Yarvelle CLA](CLA.md).
