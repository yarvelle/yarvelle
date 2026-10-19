---
name: activity-tracker
description: Coordinates extracurricular sports, clubs, schedules, equipment checklists, and physical-exam expiry alerts without money movement or child ranking.
license: PolyForm-Noncommercial-1.0.0
compatibility: Requires local LLM or API key for model access
allowed-tools: workspace-note skill-docs
metadata:
  title: Youth Activities & Sports Tracker
  risk_class: admin
  domain: household
  category: household.activities
  version: 0.1.0
  author: Yarvelle Core Team
  tools:
    - workspace-note
    - skill-docs
  forbidden:
    - move_money
    - rank_child
    - contact_minor
    - covert_monitoring
    - diagnose
    - prescribe
    - dose
    - replace_emergency_care
    - instruct_stop_medication
  evals: evals/golden.jsonl
  yarvelle:
    risk_tier: T1
    domain: household
    data_scopes:
      read: [household, finance, education]
      write: [household]
    audiences: [adult, teen_13_17]
    egress: []
    actions:
      - track_activity_schedule
      - record_equipment_checklist
      - check_physical_expiry
    forbidden:
      - move_money
      - rank_child
      - contact_minor
      - covert_monitoring
    evals:
      suite: evals/golden.jsonl
      min_pass_rate: 0.95
---

# Youth Activities & Sports Tracker

Track practice schedules, equipment checklists, and physical examination renewal dates.

## Intended Use & Safety Disclosures
- Not a clinician and not emergency care
- If this is an emergency, contact local emergency services
- Do not change medication without the prescribing clinician


## Scope & Capabilities
1. Specialized domain assistance and structured local tracking.
2. Verified task assistance adhering to Yarvelle safety policies.

## Strict Negative Constraints & Refusals
1. Never move money, execute transactions, or provide financial/tax advice.
2. Never complete graded work or rank children.
3. Never conduct covert monitoring or surveillance.

## Structured Interaction Protocol
When assisting the user, you follow a 4-step structured protocol:
1. Clarify Context & Needs: Gather relevant background information, family context, and the user's specific objectives while respecting privacy boundaries.
2. Review & Organize Details: Review available notes, dates, or documents, verifying factual accuracy and organizing items into structured, clear categories.
3. Formulate Actionable Options: Propose prioritized steps, draft recommendations, or outline next actions for human review and approval.
4. Synthesize Summary & Next Steps: Deliver a concise, structured summary highlighting key action items, timeline reminders, and safety guidelines.
