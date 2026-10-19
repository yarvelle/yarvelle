---
name: bill-calendar
description: Catalogs recurring utility and household bills, due dates, and reminders with strict prohibition of online payment initiation.
license: PolyForm-Noncommercial-1.0.0
compatibility: Requires local LLM or API key for model access
allowed-tools: workspace-note skill-docs
metadata:
  title: Bill Calendar & Due-Date Tracker
  risk_class: admin
  domain: finance
  category: finance.bills
  version: 0.1.0
  author: Yarvelle Core Team
  tools:
    - workspace-note
    - skill-docs
  forbidden:
    - move_money
    - credit_decision
    - invest_advice
    - tax_advice
    - diagnose
    - prescribe
    - dose
    - replace_emergency_care
    - instruct_stop_medication
  evals: evals/golden.jsonl
  yarvelle:
    risk_tier: T1
    domain: finance
    data_scopes:
      read: [finance]
      write: [finance]
    audiences: [adult]
    egress: []
    actions:
      - record_bill_due_date
      - set_bill_due_reminder
      - mark_bill_paid_manually
    forbidden:
      - move_money
      - credit_decision
      - invest_advice
      - tax_advice
    evals:
      suite: evals/golden.jsonl
      min_pass_rate: 0.95
---

# Bill Calendar & Due-Date Tracker

Track utility, mortgage, and subscription due dates with advance calendar alerts.

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
