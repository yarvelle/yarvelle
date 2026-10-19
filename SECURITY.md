# Security Policy & Multi-Domain Safety Disclosure

Yarvelle treats user privacy, sandbox security, child safety, financial boundaries, and clinical safety with the highest level of rigor. This document outlines our Coordinated Vulnerability Disclosure (CVD) process and incident reporting protocol.

---

## 1. Supported Versions

Security and safety patches are actively backported to the following release branches:

| Version | Supported | Maintenance Status |
|---|---|---|
| `0.1.x` | :white_check_mark: | Current active release branch |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability, sandbox escape, or safety violation in Yarvelle, please disclose it responsibly via private channels. **Do not create public GitHub issues for unresolved vulnerabilities.**

### Contact Information
- **Email**: [security@spectrayan.com](mailto:security@spectrayan.com)
- **PGP Encryption**: For sensitive disclosures, please request our security PGP public key or encrypt using our published security key on standard key servers.

### Information to Include
To help us triage and remediate the issue rapidly, please provide:
1. **Description**: Clear explanation of the vulnerability or safety failure.
2. **Impact**: Potential consequences (e.g., local file system read, cross-scope data leakage, financial write action execution, bypass of child protection).
3. **Reproduction Steps**: Minimal reproducible example, test input, or proof-of-concept (POC) script.
4. **Environment**: Yarvelle version, operating system, LLM provider/model, and Python version.

---

## 3. Scope of Security & Safety Review

### In-Scope Vulnerabilities
- **Tool Sandbox Escapes**: Path traversal attacks (`../`), symlink escapes, or arbitrary file system reads outside designated directories.
- **Cross-Scope Data Leakage**: Failures in `ScopedSession` or `ScopeContext` allowing unauthorized access across domains (e.g., reading financial data without `finance.*` scope).
- **Domain Safety Bypasses**: Bypasses of `FinanceSafetyPolicy` (e.g., executing money transfers, providing unauthorized investment advice), `EducationSafetyPolicy` (e.g., ranking children, diagnosing disabilities, bypassing COPPA local egress), or `HouseholdSafetyPolicy` (e.g., covert monitoring).
- **Cryptographic Failures**: Flaws in Argon2id KEK derivation, per-profile DEKs, or HKDF-SHA256 scope key derivations.

### Out of Scope
- Theoretical vulnerabilities without a functional proof-of-concept.
- Volumetric Denial of Service (DoS) attacks against local endpoints.
- Vulnerabilities requiring root/physical access to the user's host machine.
- Flaws in third-party LLM providers unrelated to Yarvelle runtime or guardrail nodes.

---

## 4. Response & Remediation SLAs

| Milestone | SLA Window | Description |
|---|---|---|
| **Initial Acknowledgment** | **< 24 Hours** | Confirmation of receipt by a member of the security team. |
| **Triage & Severity Assessment** | **< 72 Hours** | Initial severity ranking (CVSS score) and replication verification. |
| **Patch Development & Testing** | **< 7 Days** (Critical) | Development of backported fix and regression tests. |
| **Coordinated Public Release** | **Mutual Agreement** | Coordinated release accompanied by security advisory. |
