# Yarvelle Project Governance

Yarvelle is an open-source project governed through a meritocratic model designed to balance rapid innovation with data privacy, family safety, and architectural integrity.

---

## 1. Principles of Governance

1. **Meritocracy**: Influence and decision-making authority are earned through sustained, high-quality contributions to code, documentation, safety reviews, and community support.
2. **Family Safety & Privacy First**: Any architectural or agent behavioral change that risks child protection (COPPA compliance, academic integrity), financial guardrails (non-advisory boundaries), or clinical safety is subject to immediate rejection.
3. **Transparency**: Discussions, roadmap planning, and architectural decisions take place openly via GitHub Issues, Pull Requests, and Architecture Decision Records (ADRs).
4. **Local-First & Data Sovereignty**: Governance prioritizes patient and household autonomy, zero mandatory telemetry, and local-first execution.

---

## 2. Roles and Responsibilities

### 2.1 Project Lead (Spectrayan)
- Sets the strategic product vision, architectural principles, and long-term roadmap.
- Possesses final tie-breaking authority on controversial architectural decisions.
- Oversees brand, intellectual property, and trademark stewardship.

### 2.2 Core Maintainers
- Review and merge pull requests across `src/yarvelle/`, `packs/`, and infrastructure.
- Maintain build pipelines, CI/CD matrix, dependencies, and test automation.
- Cut official releases and manage hotfixes.

### 2.3 Reviewers
- Review agent manifests, prompt additions, and skill definitions under domain packs.
- Validate domain safety boundaries, refusal behaviors, and intended-use specifications.

### 2.4 Contributors
- Community members who submit bug reports, documentation updates, features, or agent packs.
- Anyone can become a contributor by submitting pull requests adhering to our contribution standards.

---

## 3. Decision-Making Process

Yarvelle operates on a consensus-seeking model:
- **Routine Changes**: Bug fixes, minor documentation updates, and non-breaking dependency updates can be merged under lazy consensus.
- **Substantive Changes**: New features, new specialist agents, or API changes require explicit approval from at least two Maintainers.
