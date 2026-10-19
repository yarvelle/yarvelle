/*
 * Yarvelle — Personal & Family AI Assistant Application
 * Copyright 2026 Spectrayan (https://spectrayan.com)
 *
 * Licensed under the PolyForm Noncommercial License 1.0.0 and the
 * Yarvelle Additional Terms (see LICENSE and ADDITIONAL-TERMS.md).
 * Personal and household local use only. Commercial use, hosted service
 * offering, rebranding, white-labeling, and redistribution of modified
 * forks are prohibited without a written commercial license from Spectrayan.
 *
 * Required Notice: Copyright 2026 Spectrayan (https://spectrayan.com)
 */

import React from 'react';
import { definePackUi, type SlotContribution, type SlotProps, type PackUi } from '@yarvelle/ui/slots';

// Finance Slot Components
export function BillsCalendarCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="finance-bills-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Bills & Due Dates</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Upcoming</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Track and schedule upcoming family utility, mortgage, and recurring bills.</p>
    </div>
  );
}

export function MonthlyBudgetCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="finance-budget-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Monthly Budget</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">On Track</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Monthly household spending targets, envelopes, and savings goals.</p>
    </div>
  );
}

export function StatementsCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="finance-statements-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Receipts & Statements</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Indexed local-first bank statements, invoices, and filing receipts.</p>
    </div>
  );
}

export function MedicalCostBridgeCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="finance-medical-bridge-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Medical-Cost Bridge</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Cross-domain link tracking EOBs, HSA/FSA eligible items, and out-of-pocket medical bills.</p>
    </div>
  );
}

export function SubscriptionsCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="finance-subscriptions-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Subscriptions & Memberships</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Family streaming, software, and club renewal schedules.</p>
    </div>
  );
}

export const financeSlotContributions: SlotContribution[] = [
  {
    id: 'finance.bills.calendar',
    pack: 'finance',
    slot: 'dashboard.card',
    title: 'Bills Calendar',
    icon: 'Calendar',
    order: 10,
    route: '/finance/bills',
    requiredScopes: ['finance.bills'],
    audiences: ['adult'],
    component: BillsCalendarCard,
  },
  {
    id: 'finance.budget',
    pack: 'finance',
    slot: 'dashboard.card',
    title: 'Monthly Budget',
    icon: 'PieChart',
    order: 20,
    route: '/finance/budget',
    requiredScopes: ['finance.budget'],
    audiences: ['adult'],
    component: MonthlyBudgetCard,
  },
  {
    id: 'finance.statements',
    pack: 'finance',
    slot: 'dashboard.card',
    title: 'Receipts & Statements',
    icon: 'FileText',
    order: 30,
    route: '/finance/statements',
    requiredScopes: ['finance.accounts'],
    audiences: ['adult'],
    component: StatementsCard,
  },
  {
    id: 'finance.medical-bridge',
    pack: 'finance',
    slot: 'dashboard.card',
    title: 'Medical-Cost Bridge',
    icon: 'Receipt',
    order: 40,
    route: '/finance/medical-bridge',
    requiredScopes: ['finance.bills', 'health.paperwork'],
    audiences: ['adult'],
    component: MedicalCostBridgeCard,
  },
  {
    id: 'finance.policies',
    pack: 'finance',
    slot: 'sidebar.item',
    title: 'Insurance Policies',
    icon: 'Shield',
    order: 50,
    route: '/finance/policies',
    requiredScopes: ['finance.accounts'],
    audiences: ['adult'],
  },
  {
    id: 'finance.subscriptions',
    pack: 'finance',
    slot: 'dashboard.card',
    title: 'Subscriptions',
    icon: 'CreditCard',
    order: 60,
    route: '/finance/subscriptions',
    requiredScopes: ['finance.bills'],
    audiences: ['adult'],
    component: SubscriptionsCard,
  },
];

export const financePackUi: PackUi = definePackUi({
  pack: 'finance',
  contributions: financeSlotContributions,
  messages: {
    'en-US': {
      'finance.bills.title': 'Bills & Due Dates',
      'finance.budget.title': 'Monthly Budget',
      'finance.statements.title': 'Statements & Filing',
      'finance.medical-bridge.title': 'Medical-Cost Bridge',
      'finance.subscriptions.title': 'Subscriptions Tracker',
    },
  },
});
