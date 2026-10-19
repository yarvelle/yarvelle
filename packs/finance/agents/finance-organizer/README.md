# Finance Organizer

Organize bill calendars, file receipts and statements, manage monthly budgets, and bridge medical expenses to clinical visits.

## Overview

Finance Organizer brings order to family financial paperwork. From tracking upcoming bill due dates and extracting expenses from receipts to visualizing monthly category budgets and linking medical Explanation of Benefits (EOB) statements to doctor appointments, Finance Organizer provides private, local-first financial administration.

## Key Capabilities

- **Bill Due-Date Calendar**: Log due dates and recurring reminders with zero payment initiation capabilities.
- **Statement & Receipt Filing**: Ingest statements and receipts with grounded numerical extraction linked to source text.
- **Household Budgeting**: Track monthly planned versus actual spending across customizable categories.
- **Medical-Cost Bridge**: Cross-reference insurance EOBs and doctor bills against clinical visits to track out-of-pocket totals and deductible progress.
- **Insurance Policy Organizer**: Store auto, home, and life policy documents with cited coverage summaries.
- **Subscription Tracker**: Identify recurring charges and draft cancellation checklists.

## Safety & Boundaries

Finance Organizer is strictly read-only. It cannot move money, initiate payments, or transfer funds (`move_money`). It never provides investment advice (`invest_advice`), tax filing advice (`tax_advice`), or credit decisions (`credit_decision`).

## Example Terminal Usage

```bash
yarvelle run --agent finance-organizer "Help me organize our monthly expenses into planned vs actual categories."
```
