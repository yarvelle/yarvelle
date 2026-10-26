## Description

<!-- Provide a concise explanation of what this PR introduces, modifies, or fixes. -->

## Motivation and Context

<!-- Why is this change needed? What problem does it solve? If it fixes an open issue, link it here: e.g. Fixes #123 -->

## Type of Change

<!-- Mark the appropriate box with an [x] -->
- [ ] `feat`: New domain pack capability, specialist agent, deliberation panel, or UI view
- [ ] `fix`: Bug fix, scope isolation patch, or guardrail fix
- [ ] `docs`: Documentation updates or new Architecture Decision Record (ADR)
- [ ] `refactor`: Code refactoring without behavioral change
- [ ] `perf`: Performance or query optimization
- [ ] `test`: New unit, integration, or cross-domain isolation tests
- [ ] `chore`: Maintenance, dependency, or CI/CD update

## Pre-Merge Verification Checklist

<!-- Please confirm all of the following checks pass locally prior to requesting review: -->

- [ ] **Developer Certificate of Origin (DCO)**: All commits are signed off (`git commit -s`).
- [ ] **Conventional Commits**: Commit messages follow `<type>(<scope>): <description>`.
- [ ] **License Headers**: All modified or new `.py`, `.ts`, `.tsx`, `.js`, `.mjs`, `.css` files contain the official Spectrayan PolyForm Noncommercial + Yarvelle Additional Terms copyright header.
- [ ] **Backend Test Suite**: All unit, pack, and cross-domain tests pass without regression:
  - Verified with: `PYTHONPATH=backend/src uv run --project backend pytest backend/tests/`
- [ ] **Multi-Pack & Cross-Domain Scope Isolation**:
  - `finance`, `education`, `household`, and `health` scopes remain strictly isolated.
  - Cross-scope reads use declared `declared_reads` + active runtime grants and emit `scope.cross_read` audit events.
  - ORM models include complete table, column, and index schema comments (`ensure_table_comments`).
- [ ] **Non-Prescriptive Safety & Family Governance**:
  - Advisory guardrails, age-band policies (`child_u13`, `teen_13_17`, `adult`, `older_adult`), and two-guardian approval rules preserved.
