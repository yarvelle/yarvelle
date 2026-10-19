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

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, Badge } from '@yarvelle/ui';
import { definePackUi, type SlotContribution, type SlotProps, type PackUi } from '@yarvelle/ui/slots';

// Finance Slot Components
export function BillsCalendarCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="finance-bills-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bills & Due Dates</CardTitle>
          <Badge variant="warn">Upcoming</Badge>
        </div>
        <CardDescription>Track and schedule upcoming family utility, mortgage, and recurring bills.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function MonthlyBudgetCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="finance-budget-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Monthly Budget</CardTitle>
          <Badge variant="success">On Track</Badge>
        </div>
        <CardDescription>Monthly household spending targets, envelopes, and savings goals.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function StatementsCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="finance-statements-card">
      <CardHeader>
        <CardTitle>Receipts & Statements</CardTitle>
        <CardDescription>Indexed local-first bank statements, invoices, and filing receipts.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function MedicalCostBridgeCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="finance-medical-bridge-card">
      <CardHeader>
        <CardTitle>Medical-Cost Bridge</CardTitle>
        <CardDescription>Cross-domain link tracking EOBs, HSA/FSA eligible items, and out-of-pocket medical bills.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function SubscriptionsCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="finance-subscriptions-card">
      <CardHeader>
        <CardTitle>Subscriptions & Memberships</CardTitle>
        <CardDescription>Family streaming, software, and club renewal schedules.</CardDescription>
      </CardHeader>
    </Card>
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
