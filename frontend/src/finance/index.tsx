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

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from '@yarvelle/ui';
import {
  definePackUi,
  type SlotContribution,
  type SlotProps,
  type PackUi,
} from '@yarvelle/ui/slots';
import {
  Calendar,
  Receipt,
  FileText,
  CreditCard,
  PieChart,
  Shield,
  Bell,
  ArrowUpRight,
  Link2,
  Tv,
  Music,
  Cloud,
  Laptop,
} from 'lucide-react';

// Finance Slot Components
export function BillsCalendarCard({ profileId }: SlotProps) {
  const [remindedBills, setRemindedBills] = useState<Record<string, boolean>>({});

  const bills = [
    {
      id: 'bill-mortgage',
      name: 'Apex Home Mortgage',
      category: 'Housing',
      amount: '$1,850.00',
      dueDate: 'Nov 1 (in 12 days)',
      status: 'Auto-Pay Scheduled',
      statusVariant: 'success' as const,
    },
    {
      id: 'bill-electric',
      name: 'Metro Electric & Power',
      category: 'Utilities',
      amount: '$142.30',
      dueDate: 'Oct 24 (in 4 days)',
      status: 'Due Soon',
      statusVariant: 'warn' as const,
    },
    {
      id: 'bill-water',
      name: 'City Municipal Water',
      category: 'Utilities',
      amount: '$68.45',
      dueDate: 'Oct 28 (in 8 days)',
      status: 'Pending',
      statusVariant: 'neutral' as const,
    },
    {
      id: 'bill-auto',
      name: 'Family Auto Insurance',
      category: 'Insurance',
      amount: '$312.00',
      dueDate: 'Nov 5 (in 16 days)',
      status: 'Scheduled',
      statusVariant: 'info' as const,
    },
  ];

  const toggleReminder = (id: string) => {
    setRemindedBills((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card data-testid="finance-bills-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-warn-bg text-warn-fg">
              <Calendar className="h-4 w-4" />
            </span>
            <CardTitle>Bills & Due Dates</CardTitle>
          </div>
          <Badge variant="warn">3 Upcoming</Badge>
        </div>
        <CardDescription>Track and schedule upcoming family utility, mortgage, and recurring bills.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Metric Highlight */}
        <div className="flex items-center justify-between rounded-md bg-surface-2 p-3">
          <div>
            <p className="text-xs font-medium text-fg-muted">Total Due Next 14 Days</p>
            <p className="text-xl font-bold text-fg">$2,372.75</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-fg-muted">Earliest Due</p>
            <p className="text-sm font-semibold text-warn-fg">Oct 24 · Metro Power</p>
          </div>
        </div>

        {/* Bill Rows */}
        <div className="space-y-2">
          {bills.map((bill) => {
            const hasReminder = Boolean(remindedBills[bill.id]);
            return (
              <div
                key={bill.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface p-2.5 transition-colors hover:bg-surface-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">{bill.name}</span>
                    <Badge variant={bill.statusVariant}>{bill.status}</Badge>
                  </div>
                  <p className="text-xs text-fg-muted">
                    {bill.category} · Due {bill.dueDate}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-fg">{bill.amount}</span>
                  <button
                    type="button"
                    onClick={() => toggleReminder(bill.id)}
                    aria-label={`Toggle reminder for ${bill.name}`}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs transition-colors ${
                      hasReminder
                        ? 'border-primary bg-primary text-primary-fg'
                        : 'border-border bg-surface-2 text-fg-muted hover:border-border-strong hover:text-fg'
                    }`}
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">4 scheduled bills synced</span>
        <Button variant="ghost" size="sm" className="text-xs">
          View All Bills <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function MonthlyBudgetCard({ profileId }: SlotProps) {
  const budgetEnvelopes = [
    {
      name: 'Housing & Mortgage',
      spent: 1850,
      target: 1850,
      percent: 100,
      status: 'On Target',
    },
    {
      name: 'Groceries & Household',
      spent: 840,
      target: 1200,
      percent: 70,
      status: 'On Track',
    },
    {
      name: 'Medical & HSA Expenses',
      spent: 320,
      target: 600,
      percent: 53,
      status: 'Under Budget',
    },
    {
      name: 'Utilities & Telecom',
      spent: 310,
      target: 450,
      percent: 69,
      status: 'On Track',
    },
  ];

  const totalSpent = budgetEnvelopes.reduce((acc, curr) => acc + curr.spent, 0);
  const totalTarget = budgetEnvelopes.reduce((acc, curr) => acc + curr.target, 0);
  const overallPercent = Math.round((totalSpent / totalTarget) * 100);

  return (
    <Card data-testid="finance-budget-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-success-bg text-success-fg">
              <PieChart className="h-4 w-4" />
            </span>
            <CardTitle>Monthly Budget</CardTitle>
          </div>
          <Badge variant="success">On Track · {overallPercent}%</Badge>
        </div>
        <CardDescription>Monthly household spending targets, envelopes, and savings goals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {/* Envelope Aggregate Banner */}
        <div className="rounded-md bg-surface-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-fg-muted">Total Monthly Spend</span>
            <span className="text-xs font-semibold text-primary">
              ${totalSpent.toLocaleString()} of ${totalTarget.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              role="progressbar"
              aria-label="Monthly overall budget utilization"
              aria-valuenow={overallPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-full rounded-full bg-primary transition-all duration-base"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-fg-subtle">
            <span>Cycle ends in 8 days</span>
            <span>${(totalTarget - totalSpent).toLocaleString()} remaining</span>
          </div>
        </div>

        {/* 4 Envelope Progress Bars */}
        <div className="space-y-2.5">
          {budgetEnvelopes.map((env) => (
            <div key={env.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-fg">{env.name}</span>
                <span className="text-fg-muted">
                  ${env.spent.toLocaleString()} / ${env.target.toLocaleString()}{' '}
                  <span className="font-semibold text-fg">({env.percent}%)</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  role="progressbar"
                  aria-label={`${env.name} budget progress`}
                  aria-valuenow={env.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className={`h-full rounded-full transition-all duration-base ${
                    env.percent > 90 ? 'bg-warn-fg' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(env.percent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">4 envelopes active</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Manage Envelopes <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function StatementsCard({ profileId }: SlotProps) {
  const accounts = [
    { name: 'Family Primary Checking', number: '···4821', balance: '$5,420.18', status: 'Reconciled' },
    { name: 'Household High-Yield Savings', number: '···9012', balance: '$18,250.00', status: '4.25% APY' },
    { name: 'Health Savings Account (HSA)', number: '···3304', balance: '$4,890.50', status: 'Tax-Advantaged' },
  ];

  const recentStatements = [
    { title: 'Chase_Checking_Oct2026.pdf', size: '184 KB', date: 'Oct 18', transactions: 42 },
    { title: 'Water_Power_Q3_Statement.pdf', size: '92 KB', date: 'Oct 12', transactions: 3 },
    { title: 'CVS_Pharmacy_HSA_Receipt.pdf', size: '128 KB', date: 'Oct 08', transactions: 1 },
  ];

  return (
    <Card data-testid="finance-statements-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-info-bg text-info-fg">
              <FileText className="h-4 w-4" />
            </span>
            <CardTitle>Receipts & Statements</CardTitle>
          </div>
          <Badge variant="info">Local OCR Indexed</Badge>
        </div>
        <CardDescription>Indexed local-first bank statements, invoices, and filing receipts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Account Balance Insets */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {accounts.map((acc) => (
            <div key={acc.number} className="rounded-md border border-border bg-surface-2 p-2.5">
              <p className="truncate text-xs font-medium text-fg-muted">{acc.name}</p>
              <p className="text-base font-bold text-fg">{acc.balance}</p>
              <p className="text-xs text-fg-subtle">{acc.status}</p>
            </div>
          ))}
        </div>

        {/* Recent Statement Extraction Rows */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            Recent Grounded Extractions
          </p>
          {recentStatements.map((doc) => (
            <div
              key={doc.title}
              className="flex items-center justify-between rounded-md border border-border bg-surface p-2 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Receipt className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-fg">{doc.title}</p>
                  <p className="text-xs text-fg-muted">
                    {doc.date} · {doc.size} · {doc.transactions} transactions grounded
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                Verified
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">All documents stored locally on-device</span>
        <Button variant="ghost" size="sm" className="text-xs">
          View Statement Library <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function MedicalCostBridgeCard({ profileId }: SlotProps) {
  const deductibleMet = 1250;
  const deductibleMax = 1500;
  const deductiblePct = Math.round((deductibleMet / deductibleMax) * 100);

  const oopMet = 2140;
  const oopMax = 4000;
  const oopPct = Math.round((oopMet / oopMax) * 100);

  const linkedClaims = [
    {
      id: 'claim-cardio',
      event: 'Cardiology Specialist Consult',
      billed: '$340.00',
      paid: '$260.00',
      patientCost: '$80.00',
      status: 'HSA Reimbursed ($80.00)',
      statusVariant: 'success' as const,
    },
    {
      id: 'claim-wellness',
      event: 'Annual Wellness Physical',
      billed: '$220.00',
      paid: '$220.00',
      patientCost: '$0.00',
      status: 'Preventive $0 Copay',
      statusVariant: 'info' as const,
    },
    {
      id: 'claim-ortho',
      event: 'Orthopedic Evaluation & Splint',
      billed: '$480.00',
      paid: '$315.00',
      patientCost: '$165.00',
      status: 'HSA Claim Pending',
      statusVariant: 'warn' as const,
    },
  ];

  return (
    <Card data-testid="finance-medical-bridge-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary-soft-fg">
              <Link2 className="h-4 w-4" />
            </span>
            <CardTitle>Medical-Cost Bridge</CardTitle>
          </div>
          <Badge variant="primary">Cross-Domain Link</Badge>
        </div>
        <CardDescription>Cross-domain link tracking EOBs, HSA/FSA eligible items, and out-of-pocket medical bills.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {/* Deductible & OOP Bars */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Deductible */}
          <div className="rounded-md border border-border bg-surface-2 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-fg">Annual Deductible</span>
              <span className="font-semibold text-fg">
                ${deductibleMet} / ${deductibleMax}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                role="progressbar"
                aria-label="Annual medical deductible progress"
                aria-valuenow={deductiblePct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-full rounded-full bg-primary"
                style={{ width: `${deductiblePct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-fg-subtle">
              ${deductibleMax - deductibleMet} remaining until 100% coverage
            </p>
          </div>

          {/* OOP Max */}
          <div className="rounded-md border border-border bg-surface-2 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-fg">Out-of-Pocket Max</span>
              <span className="font-semibold text-fg">
                ${oopMet} / ${oopMax}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                role="progressbar"
                aria-label="Out of pocket maximum progress"
                aria-valuenow={oopPct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-full rounded-full bg-primary"
                style={{ width: `${oopPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-fg-subtle">
              ${oopMax - oopMet} remaining until stop-loss cap
            </p>
          </div>
        </div>

        {/* Linked EOB-to-HSA Rows */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            Linked Clinical Visits ↔ HSA Reconciliations
          </p>
          {linkedClaims.map((claim) => (
            <div
              key={claim.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface p-2.5 transition-colors hover:bg-surface-2"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-fg">{claim.event}</p>
                <p className="text-xs text-fg-muted">
                  Billed: {claim.billed} · Insurer Paid: {claim.paid} · Patient: {claim.patientCost}
                </p>
              </div>
              <Badge variant={claim.statusVariant}>{claim.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">$165.00 pending HSA reimbursement</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Reconcile EOBs <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SubscriptionsCard({ profileId }: SlotProps) {
  const subscriptions = [
    {
      id: 'sub-cloud',
      name: 'Family Cloud Storage & Sync',
      cost: '$9.99/mo',
      renewalDate: 'Oct 28',
      cadence: 'Monthly',
      icon: Cloud,
      status: 'Active',
      statusVariant: 'success' as const,
    },
    {
      id: 'sub-music',
      name: 'Family Music Streaming',
      cost: '$16.99/mo',
      renewalDate: 'Nov 2',
      cadence: 'Monthly',
      icon: Music,
      status: 'Active',
      statusVariant: 'success' as const,
    },
    {
      id: 'sub-learn',
      name: 'Interactive Math & Science Tutor',
      cost: '$12.99/mo',
      renewalDate: 'Nov 14',
      cadence: 'Monthly',
      icon: Laptop,
      status: 'Active',
      statusVariant: 'success' as const,
    },
    {
      id: 'sub-stream',
      name: 'Family Documentaries & TV',
      cost: '$14.99/mo',
      renewalDate: 'Nov 19',
      cadence: 'Monthly',
      icon: Tv,
      status: 'Active',
      statusVariant: 'success' as const,
    },
    {
      id: 'sub-security',
      name: 'Home Security Monitoring',
      cost: '$59.99/yr',
      renewalDate: 'Dec 12',
      cadence: 'Annual ($5.00/mo)',
      icon: Shield,
      status: 'Annual',
      statusVariant: 'info' as const,
    },
  ];

  return (
    <Card data-testid="finance-subscriptions-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-2 text-fg">
              <CreditCard className="h-4 w-4" />
            </span>
            <CardTitle>Subscriptions & Memberships</CardTitle>
          </div>
          <Badge variant="neutral">5 Active</Badge>
        </div>
        <CardDescription>Family streaming, software, and club renewal schedules.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Monthly Run-rate Total */}
        <div className="flex items-center justify-between rounded-md bg-surface-2 p-3">
          <div>
            <p className="text-xs font-medium text-fg-muted">Total Monthly Recurring</p>
            <p className="text-xl font-bold text-fg">$59.96 / mo</p>
          </div>
          <div className="text-end">
            <p className="text-xs text-fg-muted">Annual Run Rate</p>
            <p className="text-sm font-semibold text-fg">$719.52 / yr</p>
          </div>
        </div>

        {/* Subscription Rows */}
        <div className="space-y-2">
          {subscriptions.map((sub) => {
            const Icon = sub.icon;
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface p-2.5 transition-colors hover:bg-surface-2"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-surface-2 text-fg-muted">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-fg">{sub.name}</p>
                    <p className="text-xs text-fg-muted">
                      Renews {sub.renewalDate} · {sub.cadence}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-fg">{sub.cost}</span>
                  <Badge variant={sub.statusVariant}>{sub.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">Next renewal: Oct 28 (in 8 days)</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Manage Subscriptions <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
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
