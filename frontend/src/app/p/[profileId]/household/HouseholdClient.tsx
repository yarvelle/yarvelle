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
  ClipboardList,
  CheckSquare,
  Square,
  Plus,
  UtensilsCrossed,
  Wrench,
  Users,
  Printer,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  Shield,
  Heart,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { ScopedStorage } from '@/lib/storageNamespace';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

export interface TimelineEventItem {
  id: string;
  domain: 'health' | 'finance' | 'education' | 'household';
  domainLabel: string;
  title: string;
  timestamp: string;
  description: string;
  crossLink?: {
    label: string;
    href: string;
  };
  conflictWarning?: string;
}

export interface ChoreItem {
  id: string;
  title: string;
  assignee: string;
  assigneeAvatarColor: 1 | 2 | 3 | 4 | 5;
  frequency: 'Daily' | 'Weekly' | 'Bi-Weekly';
  rewardPoints: number;
  completed: boolean;
}

export interface MealPlanDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  dish: string;
  allergens: string[];
  prepNotes: string;
}

export interface MaintenanceItem {
  id: string;
  equipment: string;
  task: string;
  dueInDays: number;
  warrantyExpiration: string;
}

export interface CaregiverHandoverSummary {
  emergencyContacts: Array<{ name: string; relation: string; phone: string }>;
  allergies: string[];
  medications: string[];
  bedtimeRoutine: string;
  wifiAndAlarms: string;
}

export interface HouseholdClientProps {
  profileId: string;
}

const DEFAULT_TIMELINE: TimelineEventItem[] = [
  {
    id: 'tl-1',
    domain: 'health',
    domainLabel: 'Health & Clinical',
    title: 'Dr. Sarah Chen Cardiology Appointment',
    timestamp: 'Thursday, Oct 23 · 9:30 AM',
    description: 'Brings 14-day blood pressure log and medication history dossier.',
    crossLink: { label: 'View Appointment Dossier', href: '/appointments' },
    conflictWarning: 'Overlaps with 9:00 AM work quarterly review meeting.',
  },
  {
    id: 'tl-2',
    domain: 'finance',
    domainLabel: 'Finance & Bills',
    title: 'Water & Sewer Auto-Pay Scheduled',
    timestamp: 'Friday, Oct 24 · $86.40',
    description: 'Deducted automatically from household checking account.',
    crossLink: { label: 'View Bills Calendar', href: '/finance' },
  },
  {
    id: 'tl-3',
    domain: 'education',
    domainLabel: 'Education & Study',
    title: 'AP Biology Photosynthesis Lab Due',
    timestamp: 'Friday, Oct 23 · 11:59 PM',
    description: 'Lab report submitted through school portal.',
    crossLink: { label: 'View Assignments', href: '/education' },
  },
  {
    id: 'tl-4',
    domain: 'household',
    domainLabel: 'Household & Chores',
    title: 'HVAC Air Filter Replacement (MERV-13)',
    timestamp: 'Saturday, Oct 25 · Recurring',
    description: 'Quarterly maintenance replacement in attic and main hallway intakes.',
  },
];

const DEFAULT_CHORES: ChoreItem[] = [
  { id: 'ch-1', title: 'Unload dishwasher & wipe kitchen counters', assignee: 'Maya', assigneeAvatarColor: 3, frequency: 'Daily', rewardPoints: 15, completed: true },
  { id: 'ch-2', title: 'Feed family pets & refresh water bowl', assignee: 'Sam', assigneeAvatarColor: 4, frequency: 'Daily', rewardPoints: 10, completed: false },
  { id: 'ch-3', title: 'Sort recycle bins & take curbside', assignee: 'Leo', assigneeAvatarColor: 1, frequency: 'Weekly', rewardPoints: 20, completed: false },
  { id: 'ch-4', title: 'Vacuum hallway rug & tidy living room', assignee: 'Maya', assigneeAvatarColor: 3, frequency: 'Weekly', rewardPoints: 25, completed: false },
];

const DEFAULT_MEALS: MealPlanDay[] = [
  { day: 'Monday', dish: 'Lemon Herb Baked Salmon & Quinoa', allergens: ['Nut-Free', 'Gluten-Free'], prepNotes: 'Thaw frozen wild salmon fillets in morning.' },
  { day: 'Tuesday', dish: 'Slow-Cooker Chicken Fajita Bowls', allergens: ['Nut-Free', 'Dairy-Free'], prepNotes: 'Combine chicken and sliced peppers in slow-cooker by 10 AM.' },
  { day: 'Wednesday', dish: 'Creamy Butternut Squash Penne Pasta', allergens: ['Vegetarian', 'Nut-Free'], prepNotes: 'Roast squash ahead of time.' },
  { day: 'Thursday', dish: 'Sheet-Pan Mediterranean Turkey Kofta', allergens: ['Nut-Free'], prepNotes: 'Serve with cucumber tzatziki and warm pita.' },
  { day: 'Friday', dish: 'Homemade Sourdough Pizza Night', allergens: ['Family Favorite'], prepNotes: 'Proof dough overnight.' },
  { day: 'Saturday', dish: 'Garden Vegetable Lentil Soup', allergens: ['Gluten-Free', 'Vegan'], prepNotes: 'Batch cook for freezer portions.' },
  { day: 'Sunday', dish: 'Roast Herb Chicken & Root Vegetables', allergens: ['Gluten-Free', 'Nut-Free'], prepNotes: 'Roast with carrots, parsnips, and rosemary.' },
];

const DEFAULT_MAINTENANCE: MaintenanceItem[] = [
  { id: 'm-1', equipment: 'HVAC Central Unit', task: 'Replace 20x25x4 MERV-13 air filter', dueInDays: 5, warrantyExpiration: 'April 2029 (Carrier Warranty)' },
  { id: 'm-2', equipment: 'Water Softener', task: 'Refill evaporated solar salt pellets (2 bags)', dueInDays: 14, warrantyExpiration: 'Active' },
  { id: 'm-3', equipment: 'Smoke & CO Detectors', task: 'Test hush button and check 10-year battery', dueInDays: 30, warrantyExpiration: 'March 2032' },
];

const DEFAULT_HANDOVER: CaregiverHandoverSummary = {
  emergencyContacts: [
    { name: 'Dr. Sarah Chen (Cardiologist)', relation: 'Physician', phone: '(555) 349-2041' },
    { name: 'Leo & Rosa (Parents)', relation: 'Primary Stewards', phone: '(555) 019-8234' },
    { name: 'Pediatric Urgent Care', relation: 'Clinic', phone: '(555) 911-0022' },
  ],
  allergies: ['Tree Nuts (Severe - EpiPen in kitchen cupboard)', 'Penicillin (Mild rash)'],
  medications: ['Daily Vitamin D3 (1000 IU with breakfast)', 'CoQ10 (100mg with dinner)'],
  bedtimeRoutine: 'Wind down at 8:30 PM, lights out by 9:00 PM for younger family members. Reading 30 minutes before bed.',
  wifiAndAlarms: 'Household WiFi: YarvelleHome / Security alarm code provided in sealed physical envelope on fridge.',
};

export function HouseholdClient({ profileId }: HouseholdClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'timeline' | 'chores' | 'meals' | 'maintenance' | 'handover'>('all');
  const [chores, setChores] = useState<ChoreItem[]>(DEFAULT_CHORES);
  const [timeline] = useState<TimelineEventItem[]>(DEFAULT_TIMELINE);
  const [meals] = useState<MealPlanDay[]>(DEFAULT_MEALS);
  const [maintenance] = useState<MaintenanceItem[]>(DEFAULT_MAINTENANCE);
  const [handover] = useState<CaregiverHandoverSummary>(DEFAULT_HANDOVER);
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);

  // Form state
  const [choreTitle, setChoreTitle] = useState('');
  const [choreAssignee, setChoreAssignee] = useState('Maya');
  const [chorePoints, setChorePoints] = useState('15');
  const [choreFrequency, setChoreFrequency] = useState<ChoreItem['frequency']>('Daily');

  const choresKey = `household_chores_${profileId}`;

  useEffect(() => {
    try {
      const storage = new ScopedStorage();
      const savedChores = storage.getItem<ChoreItem[]>(choresKey, []);
      if (savedChores && savedChores.length > 0) {
        setChores(savedChores);
      }
    } catch {}
  }, [choresKey]);

  const toggleChore = (id: string) => {
    const updated = chores.map((c) =>
      c.id === id ? { ...c, completed: !c.completed } : c
    );
    setChores(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(choresKey, updated);
    } catch {}
  };

  const handleAddChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreTitle.trim()) return;

    const newChore: ChoreItem = {
      id: `ch-${Date.now()}`,
      title: choreTitle.trim(),
      assignee: choreAssignee,
      assigneeAvatarColor: choreAssignee === 'Leo' ? 1 : choreAssignee === 'Rosa' ? 2 : choreAssignee === 'Maya' ? 3 : 4,
      frequency: choreFrequency,
      rewardPoints: parseInt(chorePoints, 10) || 15,
      completed: false,
    };

    const updated = [newChore, ...chores];
    setChores(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(choresKey, updated);
    } catch {}

    setIsAddChoreOpen(false);
    setChoreTitle('');
  };

  const handleExportGroceries = () => {
    const lines = ['# Yarvelle Household 7-Day Grocery Checklist', ''];
    meals.forEach((m) => {
      lines.push(`## ${m.day}: ${m.dish}`);
      lines.push(`- Diet: ${m.allergens.join(', ')}`);
      lines.push(`- Prep: ${m.prepNotes}`);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'household-grocery-plan.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintHandover = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)]">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="household-page-heading" className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              Household & Chores
            </h1>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Multi-domain timeline, chore rotation, weekly meal planning, home maintenance, and caregiver binder.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddChoreOpen(true)}
            data-testid="add-chore-btn"
          >
            <Plus className="w-4 h-4 me-1.5" />
            Add Chore
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div data-testid="household-tabs" className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--cf-border)]">
        {(['all', 'timeline', 'chores', 'meals', 'maintenance', 'handover'] as const).map((tab) => (
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
            {tab === 'all' ? 'All Sections' : tab}
          </button>
        ))}
      </div>

      {/* Section 1: Unified Multi-Domain Timeline */}
      {(activeTab === 'all' || activeTab === 'timeline') && (
        <div data-testid="household-timeline-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Household Multi-Domain Timeline</h2>
              <p className="text-xs text-[var(--cf-text-muted)]">Unified chronological feed across Health, Finance, Education, and Household.</p>
            </div>
            <span className="text-xs text-[var(--cf-text-muted)]">{timeline.length} schedule markers</span>
          </div>

          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs">
            {timeline.map((evt) => (
              <div key={evt.id} className="p-4 space-y-2 hover:bg-[var(--cf-surface-muted)] transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={evt.domain === 'health' ? 'danger' : evt.domain === 'finance' ? 'success' : evt.domain === 'education' ? 'info' : 'neutral'}>
                      {evt.domainLabel}
                    </Badge>
                    <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{evt.title}</h3>
                  </div>
                  <span className="text-[10px] text-[var(--cf-text-muted)] shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {evt.timestamp}
                  </span>
                </div>

                <p className="text-xs text-[var(--cf-text-secondary)]">{evt.description}</p>

                {evt.conflictWarning && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--cf-warning-text)] bg-[var(--cf-surface-elevated)] p-2 rounded-lg border border-[var(--cf-border)]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Schedule Conflict: {evt.conflictWarning}</span>
                  </div>
                )}

                {evt.crossLink && (
                  <div className="pt-1">
                    <Link
                      href={evt.crossLink.href}
                      className="text-xs font-medium text-[var(--cf-primary)] hover:underline inline-flex items-center gap-1"
                    >
                      {evt.crossLink.label} &rarr;
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Chores Rotation */}
      {(activeTab === 'all' || activeTab === 'chores') && (
        <div data-testid="household-chores-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Chore Rotation & Task Points</h2>
              <p className="text-xs text-[var(--cf-text-muted)]">Encourage responsibility and track household task completion.</p>
            </div>
            <span className="text-xs text-[var(--cf-text-muted)]">{chores.length} tasks</span>
          </div>

          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs">
            {chores.map((chore) => (
              <div key={chore.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[var(--cf-surface-muted)] transition">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleChore(chore.id)}
                    data-testid={`chore-checkbox-${chore.id}`}
                    aria-label={`Toggle chore ${chore.title}`}
                    className="text-[var(--cf-primary)] shrink-0"
                  >
                    {chore.completed ? (
                      <CheckSquare className="w-5 h-5 text-[var(--cf-primary)]" />
                    ) : (
                      <Square className="w-5 h-5 text-[var(--cf-border-strong)]" />
                    )}
                  </button>

                  <Avatar size="sm" colorSlot={chore.assigneeAvatarColor} name={chore.assignee} />

                  <div>
                    <h3 className={`text-xs font-semibold ${chore.completed ? 'line-through text-[var(--cf-text-muted)]' : 'text-[var(--cf-text-primary)]'}`}>
                      {chore.title}
                    </h3>
                    <p className="text-[10px] text-[var(--cf-text-muted)] mt-0.5">
                      Assigned to {chore.assignee} · {chore.frequency}
                    </p>
                  </div>
                </div>

                <Badge variant="warning" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[var(--cf-warning-text)]" />
                  +{chore.rewardPoints} pts
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Meal Planner */}
      {(activeTab === 'all' || activeTab === 'meals') && (
        <div data-testid="household-meals-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">7-Day Weekly Meal Planner</h2>
              <p className="text-xs text-[var(--cf-text-muted)]">Family dinner coordination with allergen safety badges.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportGroceries}
              data-testid="export-groceries-btn"
            >
              <Download className="w-4 h-4 me-1.5" />
              Export Grocery Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map((meal, i) => (
              <div key={i} className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--cf-primary)]">
                  <span>{meal.day}</span>
                  <UtensilsCrossed className="w-3.5 h-3.5 text-[var(--cf-text-muted)]" />
                </div>
                <h3 className="text-xs font-semibold text-[var(--cf-text-primary)] leading-snug">{meal.dish}</h3>
                <div className="flex flex-wrap gap-1">
                  {meal.allergens.map((alg, j) => (
                    <Badge key={j} variant="neutral" className="text-[9px]">
                      {alg}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--cf-text-muted)] bg-[var(--cf-surface-muted)] p-2 rounded-lg">
                  {meal.prepNotes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Home Maintenance */}
      {(activeTab === 'all' || activeTab === 'maintenance') && (
        <div data-testid="household-maintenance-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Home Maintenance & Appliance Warranties</h2>
            <span className="text-xs text-[var(--cf-text-muted)]">{maintenance.length} systems tracked</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {maintenance.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--cf-text-primary)]">{item.equipment}</span>
                  <Badge variant={item.dueInDays <= 7 ? 'warning' : 'neutral'}>
                    Due in {item.dueInDays} days
                  </Badge>
                </div>
                <p className="text-xs text-[var(--cf-text-secondary)]">{item.task}</p>
                <div className="text-[10px] text-[var(--cf-text-muted)] border-t border-[var(--cf-border)] pt-2 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[var(--cf-primary)]" />
                  {item.warrantyExpiration}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 5: Caregiver Handover Binder */}
      {(activeTab === 'all' || activeTab === 'handover') && (
        <div data-testid="household-handover-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Caregiver Handover Binder</h2>
              <p className="text-xs text-[var(--cf-text-muted)]">Essential instructions for babysitters, grandparents, and emergency helpers.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrintHandover}
              data-testid="print-handover-btn"
            >
              <Printer className="w-4 h-4 me-1.5" />
              Print Handover Sheet
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 space-y-6 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Emergency Contacts */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--cf-text-secondary)] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
                  Priority Emergency Contacts
                </span>
                <ul className="divide-y divide-[var(--cf-border)] border border-[var(--cf-border)] rounded-xl overflow-hidden text-xs">
                  {handover.emergencyContacts.map((c, i) => (
                    <li key={i} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[var(--cf-text-primary)]">{c.name}</span>
                        <p className="text-[10px] text-[var(--cf-text-muted)]">{c.relation}</p>
                      </div>
                      <span className="font-semibold text-[var(--cf-primary)]">{c.phone}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Allergies & Medications */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--cf-text-secondary)] flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[var(--cf-danger-text)]" />
                  Medical & Allergen Protocols
                </span>
                <div className="border border-[var(--cf-border)] rounded-xl p-3 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--cf-danger-text)] uppercase">Critical Allergies</span>
                    <ul className="list-disc list-inside text-[var(--cf-text-primary)] mt-1">
                      {handover.allergies.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[var(--cf-text-secondary)] uppercase">Active Medications</span>
                    <ul className="list-disc list-inside text-[var(--cf-text-muted)] mt-1">
                      {handover.medications.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Routines & Safety */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[var(--cf-text-muted)] border-t border-[var(--cf-border)] pt-4">
              <div className="space-y-1">
                <span className="font-semibold text-[var(--cf-text-primary)]">Bedtime & Quiet Hours</span>
                <p>{handover.bedtimeRoutine}</p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-[var(--cf-text-primary)]">WiFi & Security Code</span>
                <p>{handover.wifiAndAlarms}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Chore Modal */}
      <Dialog open={isAddChoreOpen} onOpenChange={setIsAddChoreOpen}>
        <DialogContent data-testid="add-chore-modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Household Chore</DialogTitle>
            <DialogDescription>
              Assign a routine task and allocate reward points.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddChore} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Chore Title *
              </label>
              <input
                type="text"
                required
                value={choreTitle}
                onChange={(e) => setChoreTitle(e.target.value)}
                placeholder="e.g. Tidy living room bookshelves"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Assignee
                </label>
                <select
                  value={choreAssignee}
                  onChange={(e) => setChoreAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                >
                  <option value="Maya">Maya</option>
                  <option value="Sam">Sam</option>
                  <option value="Leo">Leo</option>
                  <option value="Rosa">Rosa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                  Frequency
                </label>
                <select
                  value={choreFrequency}
                  onChange={(e) => setChoreFrequency(e.target.value as ChoreItem['frequency'])}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Reward Points
              </label>
              <input
                type="number"
                value={chorePoints}
                onChange={(e) => setChorePoints(e.target.value)}
                placeholder="15"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddChoreOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Chore
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
