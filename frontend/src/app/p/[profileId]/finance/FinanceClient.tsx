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

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Receipt,
  Plus,
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  Bell,
  BellOff,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { ScopedStorage } from '@/lib/storageNamespace';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

export interface BillItem {
  id: string;
  name: string;
  category: 'Housing' | 'Utilities' | 'Insurance' | 'Subscriptions' | 'Medical';
  amount: number;
  dueDate: string;
  status: 'Auto-Pay Scheduled' | 'Due Soon' | 'Pending' | 'Paid';
  statusVariant: 'success' | 'warning' | 'neutral' | 'info';
  reminderSet: boolean;
}

export interface BudgetEnvelope {
  category: string;
  allocated: number;
  spent: number;
  currency: string;
}

export interface MedicalBridgeProgress {
  deductibleTotal: number;
  deductibleMet: number;
  oopMaxTotal: number;
  oopMaxMet: number;
  hsaBalance: number;
  reconciledClaims: Array<{
    id: string;
    visitDate: string;
    provider: string;
    claimAmount: number;
    patientResponsibility: number;
    hsaStatus: 'Reimbursed' | 'Pending HSA' | 'Submitted';
  }>;
}

export interface SubscriptionItem {
  id: string;
  service: string;
  plan: string;
  cost: number;
  billingCycle: 'monthly' | 'annual';
  nextBillingDate: string;
  paymentMethod: string;
}

export interface FinanceClientProps {
  profileId: string;
}

const DEFAULT_BILLS: BillItem[] = [
  {
    id: 'b-1',
    name: 'Metropolitan Water & Sewer',
    category: 'Utilities',
    amount: 86.40,
    dueDate: 'In 4 days (Oct 24)',
    status: 'Auto-Pay Scheduled',
    statusVariant: 'success',
    reminderSet: true,
  },
  {
    id: 'b-2',
    name: 'State Farm Homeowners Insurance',
    category: 'Insurance',
    amount: 142.50,
    dueDate: 'In 9 days (Oct 29)',
    status: 'Due Soon',
    statusVariant: 'warning',
    reminderSet: true,
  },
  {
    id: 'b-3',
    name: 'Northwest Heart Clinic Specialist Copay',
    category: 'Medical',
    amount: 45.00,
    dueDate: 'Nov 2',
    status: 'Pending',
    statusVariant: 'neutral',
    reminderSet: false,
  },
];

const DEFAULT_BUDGETS: BudgetEnvelope[] = [
  { category: 'Groceries & Household', allocated: 950, spent: 680, currency: '$' },
  { category: 'Utilities & Internet', allocated: 380, spent: 310, currency: '$' },
  { category: 'Healthcare & Copays', allocated: 400, spent: 215, currency: '$' },
  { category: 'Student Activities & Books', allocated: 300, spent: 180, currency: '$' },
];

const DEFAULT_MEDICAL_BRIDGE: MedicalBridgeProgress = {
  deductibleTotal: 3000,
  deductibleMet: 1850,
  oopMaxTotal: 6500,
  oopMaxMet: 2420,
  hsaBalance: 1250,
  reconciledClaims: [
    {
      id: 'clm-1',
      visitDate: 'Sep 28, 2026',
      provider: 'Dr. Sarah Chen, Cardiology',
      claimAmount: 320.00,
      patientResponsibility: 45.00,
      hsaStatus: 'Reimbursed',
    },
    {
      id: 'clm-2',
      visitDate: 'Oct 04, 2026',
      provider: 'Quest Diagnostics Lab Panel',
      claimAmount: 185.00,
      patientResponsibility: 28.50,
      hsaStatus: 'Pending HSA',
    },
  ],
};

const DEFAULT_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: 'sub-1',
    service: 'Family Music Streaming',
    plan: 'Family Tier',
    cost: 16.99,
    billingCycle: 'monthly',
    nextBillingDate: 'Nov 1, 2026',
    paymentMethod: 'Visa •••• 4012',
  },
  {
    id: 'sub-2',
    service: 'Academic Cloud Library',
    plan: 'Annual Student Bundle',
    cost: 89.00,
    billingCycle: 'annual',
    nextBillingDate: 'Jan 15, 2027',
    paymentMethod: 'Mastercard •••• 8821',
  },
];

export function FinanceClient({ profileId }: FinanceClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'bills' | 'budget' | 'medical' | 'subscriptions'>('all');
  const [bills, setBills] = useState<BillItem[]>(DEFAULT_BILLS);
  const [budgets] = useState<BudgetEnvelope[]>(DEFAULT_BUDGETS);
  const [medicalBridge] = useState<MedicalBridgeProgress>(DEFAULT_MEDICAL_BRIDGE);
  const [subscriptions] = useState<SubscriptionItem[]>(DEFAULT_SUBSCRIPTIONS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState<BillItem['category']>('Utilities');
  const [billDueDate, setBillDueDate] = useState('');

  const billsKey = `finance_bills_${profileId}`;

  useEffect(() => {
    try {
      const storage = new ScopedStorage();
      const savedBills = storage.getItem<BillItem[]>(billsKey, []);
      if (savedBills && savedBills.length > 0) {
        setBills(savedBills);
      }
    } catch {}
  }, [billsKey]);

  const toggleBillReminder = (id: string) => {
    const updated = bills.map((b) =>
      b.id === id ? { ...b, reminderSet: !b.reminderSet } : b
    );
    setBills(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(billsKey, updated);
    } catch {}
  };

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billName.trim()) return;

    const newBill: BillItem = {
      id: `b-${Date.now()}`,
      name: billName.trim(),
      category: billCategory,
      amount: parseFloat(billAmount) || 50.00,
      dueDate: billDueDate.trim() || 'Nov 15',
      status: 'Pending',
      statusVariant: 'neutral',
      reminderSet: true,
    };

    const updated = [newBill, ...bills];
    setBills(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(billsKey, updated);
    } catch {}

    setIsAddModalOpen(false);
    setBillName('');
    setBillAmount('');
    setBillDueDate('');
  };

  // COPPA / Minor check: Sam (child, age 9)
  if (profileId === 'sam') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex items-center gap-3">
          <Wallet className="w-7 h-7 text-[var(--cf-primary)]" />
          <h1 data-testid="finance-page-heading" className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            Finance & Bills
          </h1>
        </div>
        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[var(--cf-warning-text)] mx-auto" />
          <h2 className="text-lg font-semibold text-[var(--cf-text-primary)]">Guardian Access Only</h2>
          <p className="text-sm text-[var(--cf-text-muted)] max-w-md mx-auto">
            Financial accounts, billing records, and budget envelopes are restricted for dependent accounts under 13. Please switch to a guardian profile to view household finances.
          </p>
        </div>
      </div>
    );
  }

  const totalMonthlyBills = bills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="finance-page-heading" className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              Finance & Bills
            </h1>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Upcoming bills, budget envelopes, Medical-Cost Bridge, and active recurring services.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            data-testid="add-bill-btn"
          >
            <Plus className="w-4 h-4 me-1.5" />
            Add Bill
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div data-testid="finance-tabs" className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--cf-border)]">
        {(['all', 'bills', 'budget', 'medical', 'subscriptions'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition capitalize shrink-0 ${
              activeTab === tab
                ? 'bg-[var(--cf-primary)] text-[var(--cf-primary-contrast)]'
                : 'text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] hover:bg-[var(--cf-surface-muted)]'
            }`}
          >
            {tab === 'all' ? 'All Sections' : tab === 'medical' ? 'Medical Bridge' : tab}
          </button>
        ))}
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-[var(--cf-text-muted)] font-medium">Upcoming Bills</span>
          <div className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            ${totalMonthlyBills.toFixed(2)}
          </div>
          <span className="text-[10px] text-[var(--cf-text-muted)]">{bills.length} pending scheduled</span>
        </div>

        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-[var(--cf-text-muted)] font-medium">Budget Spent</span>
          <div className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            $1,385 <span className="text-xs font-normal text-[var(--cf-text-muted)]">/ $2,030</span>
          </div>
          <div className="w-full bg-[var(--cf-surface-muted)] rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-[var(--cf-primary)] h-1.5 rounded-full" style={{ width: '68%' }}></div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-[var(--cf-text-muted)] font-medium">Deductible Met</span>
          <div className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            61.7%
          </div>
          <span className="text-[10px] text-[var(--cf-text-muted)]">${medicalBridge.deductibleMet} of ${medicalBridge.deductibleTotal}</span>
        </div>

        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-[var(--cf-text-muted)] font-medium">HSA Balance</span>
          <div className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            ${medicalBridge.hsaBalance}
          </div>
          <span className="text-[10px] text-[var(--cf-text-muted)]">Available for claims</span>
        </div>
      </div>

      {/* Section 1: Bills Calendar */}
      {(activeTab === 'all' || activeTab === 'bills') && (
        <div data-testid="finance-bills-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Bills Calendar & Upcoming Deadlines</h2>
            <span className="text-xs text-[var(--cf-text-muted)]">{bills.length} bills tracked</span>
          </div>

          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs">
            {bills.map((bill) => (
              <div key={bill.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--cf-surface-muted)] transition">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--cf-surface-muted)] flex items-center justify-center text-[var(--cf-primary)] shrink-0 mt-0.5">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{bill.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[var(--cf-text-muted)] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {bill.dueDate}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--cf-surface-elevated)] border border-[var(--cf-border)] text-[var(--cf-text-muted)]">
                        {bill.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-end">
                    <span className="text-sm font-bold font-fraunces text-[var(--cf-text-primary)]">
                      ${bill.amount.toFixed(2)}
                    </span>
                    <div>
                      <Badge variant={bill.statusVariant}>{bill.status}</Badge>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBillReminder(bill.id)}
                    data-testid={`bill-reminder-toggle-${bill.id}`}
                    aria-label={`Toggle reminder for ${bill.name}`}
                    className={`p-1.5 rounded-lg border transition ${
                      bill.reminderSet
                        ? 'border-[var(--cf-primary)] text-[var(--cf-primary)] bg-[var(--cf-primary-subtle)]'
                        : 'border-[var(--cf-border)] text-[var(--cf-text-muted)]'
                    }`}
                  >
                    {bill.reminderSet ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Budget Envelopes */}
      {(activeTab === 'all' || activeTab === 'budget') && (
        <div data-testid="finance-budget-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Monthly Budget Envelopes</h2>
            <span className="text-xs text-[var(--cf-text-muted)]">Zero-based envelope method</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((env, i) => {
              const pct = Math.min(100, Math.round((env.spent / env.allocated) * 100));
              const remaining = env.allocated - env.spent;
              return (
                <div key={i} className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--cf-text-primary)]">{env.category}</span>
                    <span className="text-[var(--cf-text-muted)]">${env.spent} of ${env.allocated}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="w-full bg-[var(--cf-surface-muted)] rounded-full h-2 overflow-hidden"
                  >
                    <div
                      className={`h-2 rounded-full transition-all ${
                        pct > 90 ? 'bg-[var(--cf-warning-text)]' : 'bg-[var(--cf-primary)]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--cf-text-muted)]">
                    <span>{pct}% spent</span>
                    <span>${remaining} remaining buffer</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Medical-Cost Bridge */}
      {(activeTab === 'all' || activeTab === 'medical') && (
        <div data-testid="finance-medical-bridge-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Medical-Cost Bridge & Claims</h2>
              <p className="text-xs text-[var(--cf-text-muted)]">Cross-domain link between clinical visits, EOBs, and HSA reimbursements.</p>
            </div>
            <Badge variant="info">In-Network Plan</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-[var(--cf-text-secondary)]">Annual Deductible</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-fraunces text-[var(--cf-text-primary)]">
                  ${medicalBridge.deductibleMet}
                </span>
                <span className="text-xs text-[var(--cf-text-muted)]">Target: ${medicalBridge.deductibleTotal}</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.round((medicalBridge.deductibleMet / medicalBridge.deductibleTotal) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full bg-[var(--cf-surface-muted)] rounded-full h-2 overflow-hidden"
              >
                <div
                  className="bg-[var(--cf-primary)] h-2 rounded-full"
                  style={{ width: `${(medicalBridge.deductibleMet / medicalBridge.deductibleTotal) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-2">
              <span className="text-xs font-semibold text-[var(--cf-text-secondary)]">Out-of-Pocket Maximum</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-fraunces text-[var(--cf-text-primary)]">
                  ${medicalBridge.oopMaxMet}
                </span>
                <span className="text-xs text-[var(--cf-text-muted)]">Max: ${medicalBridge.oopMaxTotal}</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.round((medicalBridge.oopMaxMet / medicalBridge.oopMaxTotal) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full bg-[var(--cf-surface-muted)] rounded-full h-2 overflow-hidden"
              >
                <div
                  className="bg-[var(--cf-accent)] h-2 rounded-full"
                  style={{ width: `${(medicalBridge.oopMaxMet / medicalBridge.oopMaxTotal) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* EOB Reconciliation Table */}
          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[var(--cf-border)]">
              <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">Recent Reconciled Clinical Claims</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-[var(--cf-surface-muted)] text-[var(--cf-text-muted)] border-b border-[var(--cf-border)]">
                  <tr>
                    <th className="py-2.5 px-4 font-medium text-start">Visit Date</th>
                    <th className="py-2.5 px-4 font-medium text-start">Provider & Service</th>
                    <th className="py-2.5 px-4 font-medium text-start">Billed Amount</th>
                    <th className="py-2.5 px-4 font-medium text-start">Your Responsibility</th>
                    <th className="py-2.5 px-4 font-medium text-start">HSA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cf-border)] text-[var(--cf-text-primary)]">
                  {medicalBridge.reconciledClaims.map((claim) => (
                    <tr key={claim.id} data-testid={`eob-row-${claim.id}`}>
                      <td className="py-3 px-4 font-medium">{claim.visitDate}</td>
                      <td className="py-3 px-4">{claim.provider}</td>
                      <td className="py-3 px-4">${claim.claimAmount.toFixed(2)}</td>
                      <td className="py-3 px-4 font-semibold text-[var(--cf-primary)]">${claim.patientResponsibility.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={claim.hsaStatus === 'Reimbursed' ? 'success' : 'warning'}>
                          {claim.hsaStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Subscriptions */}
      {(activeTab === 'all' || activeTab === 'subscriptions') && (
        <div data-testid="finance-subscriptions-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Active Recurring Subscriptions</h2>
            <span className="text-xs text-[var(--cf-text-muted)]">{subscriptions.length} active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{sub.service}</h3>
                  <p className="text-[10px] text-[var(--cf-text-muted)] mt-0.5">{sub.plan} · {sub.paymentMethod}</p>
                  <p className="text-[10px] text-[var(--cf-text-secondary)] mt-1">Renews on {sub.nextBillingDate}</p>
                </div>
                <div className="text-end">
                  <span className="text-sm font-bold font-fraunces text-[var(--cf-text-primary)]">
                    ${sub.cost.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-[var(--cf-text-muted)]">/{sub.billingCycle === 'monthly' ? 'mo' : 'yr'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent data-testid="add-bill-modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bill or Expense</DialogTitle>
            <DialogDescription>
              Track an upcoming bill, medical expense, or service fee.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBill} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Bill / Payee Name *
              </label>
              <input
                type="text"
                required
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                placeholder="e.g. Electric Company"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="85.00"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Category
                </label>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value as BillItem['category'])}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                >
                  <option value="Utilities">Utilities</option>
                  <option value="Housing">Housing</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Medical">Medical</option>
                  <option value="Subscriptions">Subscriptions</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Due Date
              </label>
              <input
                type="text"
                value={billDueDate}
                onChange={(e) => setBillDueDate(e.target.value)}
                placeholder="e.g. In 5 days or Nov 10"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Bill
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
