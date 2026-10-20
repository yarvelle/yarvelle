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
  Clock,
  Link2,
  CheckSquare,
  Utensils,
  Wrench,
  Plane,
  ClipboardList,
  Sliders,
  AlertTriangle,
  Check,
  ChevronRight,
  Flame,
  Phone,
  ShieldAlert,
  ShoppingCart,
  AlertCircle,
  Printer,
} from 'lucide-react';

export function UnifiedTimelineCard({ profileId }: SlotProps) {
  const [filter, setFilter] = useState<string>('all');

  const timelineItems = [
    {
      id: 'tl-1',
      domain: 'health',
      domainLabel: 'Health',
      domainStyle: 'bg-scope-health-bg text-scope-health-fg border-scope-health-border',
      time: 'Today · 09:30 AM',
      title: 'Dr. Chen Cardiology Consultation',
      detail: 'Valley Health Clinic · Prep dossier ready',
      member: 'Maya',
      status: 'Scheduled',
      statusVariant: 'info' as const,
    },
    {
      id: 'tl-2',
      domain: 'household',
      domainLabel: 'Household',
      domainStyle: 'bg-scope-household-bg text-scope-household-fg border-scope-household-border',
      time: 'Today · 12:00 PM',
      title: 'HVAC Air Filter Replacement (MERV-13)',
      detail: 'Main return vent · 90-day maintenance cycle due',
      member: 'Home',
      status: 'Due Today',
      statusVariant: 'warn' as const,
    },
    {
      id: 'tl-3',
      domain: 'education',
      domainLabel: 'Education',
      domainStyle: 'bg-scope-education-bg text-scope-education-fg border-scope-education-border',
      time: 'Tomorrow · 08:30 AM',
      title: 'Middle School Science Fair Submission',
      detail: 'Solar panel battery prototype & research paper',
      member: 'Leo',
      status: 'In Progress',
      statusVariant: 'neutral' as const,
    },
    {
      id: 'tl-4',
      domain: 'finance',
      domainLabel: 'Finance',
      domainStyle: 'bg-scope-finance-bg text-scope-finance-fg border-scope-finance-border',
      time: 'Thu Oct 23 · 11:59 PM',
      title: 'City Municipal Water & Electric Bill',
      detail: '$142.50 · Scheduled via auto-pay bank bridge',
      member: 'Household',
      status: 'Auto-Pay',
      statusVariant: 'success' as const,
    },
  ];

  const filteredItems =
    filter === 'all'
      ? timelineItems
      : timelineItems.filter((item) => item.domain === filter);

  return (
    <Card data-testid="household-timeline-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Unified Family Timeline</CardTitle>
          </div>
          <Badge variant="success">Live</Badge>
        </div>
        <CardDescription>
          Chronological family feed across health visits, bill deadlines, school milestones, and home routines.
        </CardDescription>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {['all', 'health', 'finance', 'education', 'household'].map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => setFilter(domain)}
              className={`text-xs px-2.5 py-1 rounded-sm border font-medium transition-colors ${
                filter === domain
                  ? 'bg-primary text-primary-fg border-primary'
                  : 'bg-surface-2 text-fg-muted border-border hover:bg-surface-3'
              }`}
            >
              {domain.charAt(0).toUpperCase() + domain.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-md bg-surface-2 border border-border flex items-start justify-between gap-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${item.domainStyle}`}>
                  {item.domainLabel}
                </span>
                <span className="text-xs text-fg-subtle">{item.time}</span>
              </div>
              <h4 className="text-sm font-semibold text-fg truncate">{item.title}</h4>
              <p className="text-xs text-fg-muted">{item.detail}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant={item.statusVariant}>{item.status}</Badge>
              <span className="text-[11px] text-fg-subtle">{item.member}</span>
            </div>
          </div>
        ))}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-fg-subtle">4 events this week across 4 domains</span>
        <Button variant="ghost" size="sm" className="text-xs">
          View full calendar <ChevronRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function CrossDomainLinksCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="household-cross-links-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <CardTitle>Cross-Domain Links & Alerts</CardTitle>
          </div>
          <Badge variant="warn">2 Conflicts</Badge>
        </div>
        <CardDescription>
          Connected multi-domain entities and schedule conflict detection (YV-X-3).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* YV-X-3 Conflict Alert Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-fg">
            <span>Schedule Conflict Clusters (YV-X-3)</span>
            <Badge variant="danger">Action Required</Badge>
          </div>

          {/* Conflict 1: Overlap */}
          <div className="p-3 rounded-md bg-warn-bg border border-warn-border space-y-1.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warn-fg shrink-0" />
              <span className="text-xs font-bold text-warn-fg">Simultaneous Event Overlap</span>
            </div>
            <p className="text-xs text-warn-fg">
              Friday 02:30 PM: Dr. Chen Cardiology consultation overlaps with School Parent-Teacher conference.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm border bg-scope-health-bg text-scope-health-fg border-scope-health-border">
                Health
              </span>
              <span className="text-xs text-warn-fg font-medium">↔</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm border bg-scope-education-bg text-scope-education-fg border-scope-education-border">
                Education
              </span>
              <span className="text-[11px] text-warn-fg ms-auto font-medium underline cursor-pointer">
                Delegate pickup to Jordan
              </span>
            </div>
          </div>

          {/* Conflict 2: Fasting Prep */}
          <div className="p-3 rounded-md bg-info-bg border border-info-border space-y-1.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-info-fg shrink-0" />
              <span className="text-xs font-bold text-info-fg">Medical Prep Boundary Conflict</span>
            </div>
            <p className="text-xs text-info-fg">
              Saturday 08:00 AM Fasting Bloodwork vs Friday 07:30 PM Scheduled Family Dinner.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm border bg-scope-health-bg text-scope-health-fg border-scope-health-border">
                Health
              </span>
              <span className="text-xs text-info-fg font-medium">↔</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm border bg-scope-household-bg text-scope-household-fg border-scope-household-border">
                Household
              </span>
              <span className="text-[11px] text-info-fg ms-auto font-medium underline cursor-pointer">
                Shift dinner to 06:00 PM
              </span>
            </div>
          </div>
        </div>

        {/* Typed Cross-Domain Links (YV-X-2) */}
        <div className="space-y-2 pt-2 border-t border-border">
          <span className="text-xs font-semibold text-fg">Active Cross-Domain Links</span>

          {/* Link 1: Visit <-> EOB */}
          <div className="p-2.5 rounded-md bg-surface-2 border border-border flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="font-medium text-fg flex items-center gap-1.5">
                <span>Cardiology Visit</span>
                <span className="text-fg-subtle">↔</span>
                <span>EOB Claim No. 94821</span>
              </div>
              <p className="text-[11px] text-fg-muted">$45.00 copay eligible for HSA reimbursement</p>
            </div>
            <Badge variant="success">Linked</Badge>
          </div>

          {/* Link 2: Form <-> Activity */}
          <div className="p-2.5 rounded-md bg-surface-2 border border-border flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="font-medium text-fg flex items-center gap-1.5">
                <span>Sports Physical Clearance</span>
                <span className="text-fg-subtle">↔</span>
                <span>Fall Soccer League</span>
              </div>
              <p className="text-[11px] text-fg-muted">Clearance form attached to youth registration</p>
            </div>
            <Badge variant="success">Verified</Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-fg-subtle">Automated cross-domain link verification active</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Resolve alerts <ChevronRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ChoresRotationCard({ profileId }: SlotProps) {
  const [chores, setChores] = useState([
    {
      id: 'chore-1',
      title: 'Dishwasher unload & stack morning dishes',
      assignee: 'Leo',
      routine: 'Morning',
      done: true,
    },
    {
      id: 'chore-2',
      title: 'Feed family dog Buster & afternoon walk',
      assignee: 'Maya',
      routine: 'Afternoon',
      done: true,
    },
    {
      id: 'chore-3',
      title: 'Wipe kitchen counters & rinse sink',
      assignee: 'Jordan',
      routine: 'Evening',
      done: false,
    },
    {
      id: 'chore-4',
      title: 'Take recycling & compost bins to curb',
      assignee: 'Family Shared',
      routine: 'Evening',
      done: false,
    },
  ]);

  const toggleChore = (id: string) => {
    setChores((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  const completedCount = chores.filter((c) => c.done).length;
  const progressPercent = Math.round((completedCount / chores.length) * 100);

  const daysOfWeek = [
    { day: 'M', completed: true },
    { day: 'T', completed: true },
    { day: 'W', completed: true },
    { day: 'T', completed: true },
    { day: 'F', completed: true },
    { day: 'S', completed: false, isToday: true },
    { day: 'S', completed: false },
  ];

  return (
    <Card data-testid="household-chores-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <CardTitle>Chores & Routines</CardTitle>
          </div>
          <Badge variant="info">Today</Badge>
        </div>
        <CardDescription>
          Fair 7-day chore rotation, daily routine check-offs, and streak tracking.
        </CardDescription>

        {/* 7-Day Rotation Streak Tracker */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            {daysOfWeek.map((d, idx) => (
              <div
                key={idx}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                  d.completed
                    ? 'bg-success-bg text-success-fg border-success-border'
                    : d.isToday
                    ? 'bg-primary text-primary-fg border-primary ring-2 ring-focus'
                    : 'bg-surface-2 text-fg-muted border-border'
                }`}
              >
                {d.day}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-warn-fg bg-warn-bg px-2 py-1 rounded-sm border border-warn-border">
            <Flame className="h-3.5 w-3.5" />
            <span>5-day streak</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-fg">Today's Family Checklist</span>
          <span className="text-fg-subtle">{completedCount} of {chores.length} completed</span>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Daily chore completion progress"
          className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden"
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Chores Check-off Rows */}
        <div className="space-y-2 pt-1">
          {chores.map((c) => (
            <div
              key={c.id}
              role="checkbox"
              tabIndex={0}
              aria-checked={c.done}
              onClick={() => toggleChore(c.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggleChore(c.id);
                }
              }}
              className="flex items-center justify-between p-2.5 rounded-md bg-surface-2 border border-border hover:bg-surface-3 cursor-pointer transition-colors text-xs select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 border transition-colors ${
                    c.done
                      ? 'bg-primary border-primary text-primary-fg'
                      : 'border-border-strong bg-surface'
                  }`}
                >
                  {c.done && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <span className={`truncate ${c.done ? 'line-through text-fg-muted' : 'font-medium text-fg'}`}>
                  {c.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 ms-2 shrink-0">
                <span className="text-[11px] text-fg-subtle">{c.routine}</span>
                <Badge variant={c.done ? 'success' : 'neutral'}>{c.assignee}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-fg-subtle">Weekly rotation resets Monday 06:00 AM</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Rotation rules <ChevronRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function MealPlannerCard({ profileId }: SlotProps) {
  const meals = [
    {
      day: 'Mon',
      dish: 'Wild Salmon with Asparagus & Lemon Quinoa',
      prep: '25m',
      badges: ['Nut-Free', 'Low-Sodium'],
    },
    {
      day: 'Tue',
      dish: 'Street Tacos with Corn Tortillas & Fresh Pico',
      prep: '30m',
      badges: ['Nut-Free'],
    },
    {
      day: 'Wed',
      dish: 'Mediterranean Lentil Stew & Spinach Salad',
      prep: '40m',
      badges: ['Nut-Free', 'Low-Sodium'],
    },
    {
      day: 'Thu',
      dish: 'Sheet-Pan Herb Chicken with Sweet Potato Mash',
      prep: '35m',
      badges: ['Nut-Free'],
    },
    {
      day: 'Fri',
      dish: 'Homemade Crust Pizza & Mixed Garden Greens',
      prep: '20m',
      badges: ['Nut-Free'],
    },
  ];

  return (
    <Card data-testid="household-meals-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            <CardTitle>Meal Planner & Groceries</CardTitle>
          </div>
          <Badge variant="success">Allergy Guard Active</Badge>
        </div>
        <CardDescription>
          Weekly dinner schedule with dietary safety badges and ingredient grocery items.
        </CardDescription>

        {/* Dietary Safety Badges */}
        <div className="flex items-center gap-2 pt-2">
          <Badge variant="danger" className="text-[10px]">Nut-Free Facility</Badge>
          <Badge variant="warn" className="text-[10px]">Low-Sodium Option</Badge>
          <span className="text-xs text-fg-subtle ms-auto">5 Dinners Planned</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Dinner Schedule */}
        <div className="space-y-2">
          {meals.map((m, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-md bg-surface-2 border border-border flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 font-bold text-fg-muted shrink-0 text-center">{m.day}</span>
                <span className="font-medium text-fg truncate">{m.dish}</span>
              </div>
              <div className="flex items-center gap-1.5 ms-2 shrink-0">
                {m.badges.map((b) => (
                  <span
                    key={b}
                    className="text-[10px] px-1.5 py-0.5 rounded-sm bg-surface text-fg-muted border border-border font-medium"
                  >
                    {b}
                  </span>
                ))}
                <span className="text-fg-subtle text-[11px]">{m.prep}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Grocery items checklist preview */}
        <div className="p-3 rounded-md bg-surface-3 border border-border space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-fg">
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5 text-primary" />
              <span>Needed Grocery Items</span>
            </div>
            <span className="text-[11px] text-fg-subtle">3 items pending</span>
          </div>
          <div className="text-xs text-fg-muted space-y-1 pt-1">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-sm border border-border-strong bg-surface" />
              <span>Wild Salmon Fillets (1.5 lbs, fresh)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-sm border border-border-strong bg-surface" />
              <span>Organic Asparagus & Fresh Limes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-sm border border-border-strong bg-surface" />
              <span>Quinoa grain & low-sodium vegetable stock</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-fg-subtle">Verified against household allergen profiles</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Add items to cart <ChevronRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function HomeMaintenanceCard({ profileId }: SlotProps) {
  const filters = [
    {
      name: 'HVAC Main Air Filter (20x25x4 MERV-13)',
      dueDays: 12,
      cycleDays: 90,
      elapsedDays: 78,
      status: 'Due Soon',
      variant: 'warn' as const,
    },
    {
      name: 'Refrigerator Water Filter (PureSource Ultra)',
      dueDays: 70,
      cycleDays: 180,
      elapsedDays: 110,
      status: 'Good',
      variant: 'neutral' as const,
    },
    {
      name: 'Smoke & CO Detectors (Semi-Annual Battery Check)',
      dueDays: 24,
      cycleDays: 180,
      elapsedDays: 156,
      status: 'Upcoming',
      variant: 'info' as const,
    },
  ];

  const warranties = [
    { system: 'Carrier Infinity 19 Heat Pump', expires: 'Nov 2028', active: true },
    { system: 'Rheem Performance Tankless Water Heater', expires: 'Aug 2029', active: true },
    { system: 'Bosch 800 Series Silent Dishwasher', expires: 'Mar 2027', active: true },
  ];

  return (
    <Card data-testid="household-maintenance-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <CardTitle>Home Maintenance</CardTitle>
          </div>
          <Badge variant="warn">Filter Due</Badge>
        </div>
        <CardDescription>
          Appliance warranty tracking, consumable filter replacements, and contractor service logs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Consumable Filters */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-fg">Filter Replacements</span>
          {filters.map((f, idx) => {
            const percent = Math.round((f.elapsedDays / f.cycleDays) * 100);
            return (
              <div key={idx} className="p-2.5 rounded-md bg-surface-2 border border-border space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-fg truncate">{f.name}</span>
                  <Badge variant={f.variant}>{f.status}</Badge>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${f.name} replacement progress`}
                  className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      f.dueDays <= 14 ? 'bg-warn-fg' : 'bg-primary'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-fg-subtle">
                  <span>{percent}% elapsed ({f.elapsedDays}/{f.cycleDays} days)</span>
                  <span>Due in {f.dueDays} days</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Appliance Warranties */}
        <div className="space-y-2 pt-2 border-t border-border">
          <span className="text-xs font-semibold text-fg">Active Appliance Warranties</span>
          <div className="space-y-1.5">
            {warranties.map((w, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-sm bg-surface-2 border border-border text-xs"
              >
                <span className="font-medium text-fg truncate">{w.system}</span>
                <span className="text-fg-subtle text-[11px] ms-2 shrink-0">Expires {w.expires}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-fg-subtle">3 active appliance warranties</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Order replacement filter <ChevronRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function TravelItinerariesCard({ profileId }: SlotProps) {
  const milestones = [
    { title: 'Flight #AS-1422 (Depart Seattle SeaTac)', time: 'Nov 22 · 09:30 AM', status: 'Confirmed' },
    { title: 'Port Angeles Mountain Cabin Check-In', time: 'Nov 22 · 03:00 PM', status: 'Booked' },
    { title: 'Hurricane Ridge Guided Day Excursion', time: 'Nov 24 · 10:00 AM', status: 'Pass Ready' },
  ];

  const packingTotal = 16;
  const packingPacked = 10;
  const packingPercent = Math.round((packingPacked / packingTotal) * 100);

  return (
    <Card data-testid="household-travel-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            <CardTitle>Travel & Trips</CardTitle>
          </div>
          <Badge variant="info">33 Days Away</Badge>
        </div>
        <CardDescription>
          Family vacation prep, packing checklists, and flight itineraries.
        </CardDescription>

        <div className="p-2.5 mt-2 rounded-md bg-surface-2 border border-border">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-fg">Olympic Coast & Mountain Cabin</h4>
            <Badge variant="success">Nov 22–27</Badge>
          </div>
          <p className="text-xs text-fg-muted mt-0.5">5 Nights · 3 Travelers · 1 Cabin Reservation</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Itinerary Milestones */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-fg">Key Itinerary Milestones</span>
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-md bg-surface-2 border border-border flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5 min-w-0">
                <span className="font-medium text-fg truncate block">{m.title}</span>
                <span className="text-[11px] text-fg-subtle">{m.time}</span>
              </div>
              <Badge variant="neutral" className="ms-2 shrink-0">{m.status}</Badge>
            </div>
          ))}
        </div>

        {/* Packing Progress */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-fg">Packing Progress</span>
            <span className="text-fg-subtle">{packingPacked} of {packingTotal} items packed</span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={packingPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Trip packing progress"
            className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden"
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${packingPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-success-bg text-success-fg border border-success-border font-medium">
              Warm Layers (Done)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-success-bg text-success-fg border border-success-border font-medium">
              Hiking Boots (Done)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-warn-bg text-warn-fg border border-warn-border font-medium">
              First Aid Kit (2 pending)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-surface-2 text-fg-muted border border-border font-medium">
              Camera & Charger
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-fg-subtle">Shared itinerary across adult & teen devices</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Open packing list <ChevronRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function CaregiverHandoverCard({ profileId }: SlotProps) {
  const contacts = [
    { role: 'Primary Steward', name: 'Jordan', phone: '(555) 019-2831' },
    { role: 'Backup Guardian', name: 'Martha Davis', phone: '(555) 014-9922' },
    { role: 'Pediatric Clinic', name: 'Eastside Pediatrics', phone: '(555) 018-4400' },
    { role: 'Urgent Care / ER', name: 'Valley Memorial Hospital (1.8 mi)', phone: '(555) 019-0099' },
  ];

  return (
    <Card data-testid="household-handover-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle>Caregiver Handover Binder</CardTitle>
          </div>
          <Badge variant="success">Ready</Badge>
        </div>
        <CardDescription>
          Emergency contacts, daily routines, and medical allergy notes for babysitters and family caregivers.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Critical Medical & Allergy Note */}
        <div className="p-3 rounded-md bg-danger-bg border border-danger-border space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-danger-fg shrink-0" />
            <span className="text-xs font-bold text-danger-fg">Critical Allergen Notice</span>
          </div>
          <p className="text-xs text-danger-fg leading-relaxed">
            Severe Peanut Allergy (Leo): EpiPen Junior is kept in top right kitchen pantry. Inhaler (Albuterol) in blue school backpack; 2 puffs every 4h as needed for wheeze.
          </p>
        </div>

        {/* Emergency Contacts List */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-fg">Emergency Contact Directory</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {contacts.map((c, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-md bg-surface-2 border border-border space-y-0.5 text-xs"
              >
                <span className="text-[10px] text-fg-subtle uppercase tracking-wider block font-semibold">
                  {c.role}
                </span>
                <span className="font-semibold text-fg block">{c.name}</span>
                <div className="flex items-center gap-1 text-primary font-medium">
                  <Phone className="h-3 w-3" />
                  <span>{c.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Routine Summary */}
        <div className="p-2.5 rounded-md bg-surface-2 border border-border text-xs space-y-1">
          <span className="font-semibold text-fg block">Evening Routine Guidelines</span>
          <p className="text-fg-muted text-[11px]">
            Dinner at 06:00 PM · 20 min reading at 07:45 PM · Lights out strictly at 08:30 PM.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-fg-subtle">Updated today · Signed by steward</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="text-xs">
            <Printer className="me-1 h-3.5 w-3.5" /> Print Sheet
          </Button>
          <Button variant="primary" size="sm" className="text-xs">
            Share Token
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export function PanelTogglesSection({ profileId }: SlotProps) {
  const [packToggles, setPackToggles] = useState<Record<string, boolean>>({
    health: true,
    finance: true,
    education: true,
    household: true,
  });

  const [panelToggles, setPanelToggles] = useState<Record<string, boolean>>({
    'household.timeline': true,
    'household.cross-links': true,
    'household.chores': true,
    'household.meals': true,
    'household.maintenance': true,
    'household.travel': true,
    'household.handover': true,
  });

  const togglePack = (pack: string) => {
    setPackToggles((prev) => ({ ...prev, [pack]: !prev[pack] }));
  };

  const togglePanel = (id: string) => {
    setPanelToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card data-testid="household-panel-toggles" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <CardTitle>Household Domain Toggles</CardTitle>
          </div>
          <Badge variant="primary">Settings</Badge>
        </div>
        <CardDescription>
          Enable or disable domain views (Health, Finance, Education, Household) per household member.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Domain Pack Master Toggles */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-fg">Domain Pack Activations</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'health', label: 'Health & Clinical Pack', desc: 'Vitals, visits, preventive care' },
              { id: 'finance', label: 'Finance & Bills Pack', desc: 'Bills, monthly budget, statements' },
              { id: 'education', label: 'Education & Study Pack', desc: 'Calendar, assignments, reading' },
              { id: 'household', label: 'Household Logistics Pack', desc: 'Timeline, chores, meals, maintenance' },
            ].map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-md bg-surface-2 border border-border flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-fg block">{p.label}</span>
                  <span className="text-[11px] text-fg-muted block">{p.desc}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={packToggles[p.id]}
                  onClick={() => togglePack(p.id)}
                  className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                    packToggles[p.id] ? 'bg-primary justify-end' : 'bg-surface-3 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-surface shadow-1 block" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Slot Panel Toggles */}
        <div className="space-y-3 pt-3 border-t border-border">
          <span className="text-xs font-semibold text-fg">Household Dashboard Cards Visibility</span>
          <div className="space-y-2">
            {[
              { id: 'household.timeline', label: 'Family Timeline', desc: 'Chronological feed across all domains' },
              { id: 'household.cross-links', label: 'Cross-Domain Links & Alerts', desc: 'Schedule conflict alerts and entity links' },
              { id: 'household.chores', label: 'Chores & Daily Routines', desc: '7-day chore rotation and check-offs' },
              { id: 'household.meals', label: 'Meal Planner & Groceries', desc: 'Weekly dinner plans and allergen badges' },
              { id: 'household.maintenance', label: 'Home Maintenance & Warranties', desc: 'Filters and appliance warranties' },
              { id: 'household.travel', label: 'Travel Itineraries & Trips', desc: 'Trip packing and milestones' },
              { id: 'household.handover', label: 'Caregiver Handover Binder', desc: 'Emergency contacts and caregiver instructions' },
            ].map((panel) => (
              <div
                key={panel.id}
                className="p-2.5 rounded-md bg-surface-2 border border-border flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-medium text-fg block">{panel.label}</span>
                  <span className="text-[11px] text-fg-subtle block">{panel.desc}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={panelToggles[panel.id]}
                  onClick={() => togglePanel(panel.id)}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                    panelToggles[panel.id] ? 'bg-primary justify-end' : 'bg-surface-3 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-surface shadow-1 block" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-fg-subtle">Stored in local household settings</span>
        <Button variant="primary" size="sm" className="text-xs">
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
}

export const householdSlotContributions: SlotContribution[] = [
  {
    id: 'household.timeline',
    pack: 'household',
    slot: 'dashboard.card',
    title: 'Family Timeline',
    icon: 'Clock',
    order: 5,
    route: '/household/timeline',
    requiredScopes: ['household.calendar'],
    audiences: ['adult', 'teen', 'child'],
    component: UnifiedTimelineCard,
  },
  {
    id: 'household.cross-links',
    pack: 'household',
    slot: 'dashboard.card',
    title: 'Cross-Domain Links & Alerts',
    icon: 'Link2',
    order: 15,
    route: '/household/cross-links',
    requiredScopes: ['household.governance'],
    audiences: ['adult'],
    component: CrossDomainLinksCard,
  },
  {
    id: 'household.chores',
    pack: 'household',
    slot: 'dashboard.card',
    title: 'Chores & Routines',
    icon: 'CheckSquare',
    order: 25,
    route: '/household/chores',
    requiredScopes: ['household.chores'],
    audiences: ['adult', 'teen', 'child'],
    component: ChoresRotationCard,
  },
  {
    id: 'household.meals',
    pack: 'household',
    slot: 'dashboard.card',
    title: 'Meal Planner',
    icon: 'Utensils',
    order: 35,
    route: '/household/meals',
    requiredScopes: ['household.meals'],
    audiences: ['adult', 'teen', 'child'],
    component: MealPlannerCard,
  },
  {
    id: 'household.maintenance',
    pack: 'household',
    slot: 'dashboard.card',
    title: 'Home Maintenance',
    icon: 'Wrench',
    order: 45,
    route: '/household/maintenance',
    requiredScopes: ['household.maintenance'],
    audiences: ['adult'],
    component: HomeMaintenanceCard,
  },
  {
    id: 'household.travel',
    pack: 'household',
    slot: 'dashboard.card',
    title: 'Travel & Trips',
    icon: 'Plane',
    order: 55,
    route: '/household/travel',
    requiredScopes: ['household.travel'],
    audiences: ['adult', 'teen'],
    component: TravelItinerariesCard,
  },
  {
    id: 'household.handover',
    pack: 'household',
    slot: 'dashboard.card',
    title: 'Caregiver Handover',
    icon: 'ClipboardList',
    order: 65,
    route: '/household/handover',
    requiredScopes: ['household.governance'],
    audiences: ['adult'],
    component: CaregiverHandoverCard,
  },
  {
    id: 'household.panel-toggles',
    pack: 'household',
    slot: 'settings.section',
    title: 'Family Domain Switcher & Toggles',
    icon: 'Sliders',
    order: 70,
    route: '/settings/household-toggles',
    requiredScopes: ['household.governance'],
    audiences: ['adult'],
    component: PanelTogglesSection,
  },
];

export const householdPackUi: PackUi = definePackUi({
  pack: 'household',
  contributions: householdSlotContributions,
  messages: {
    'en-US': {
      'household.timeline.title': 'Family Timeline',
      'household.chores.title': 'Chores & Routines',
      'household.meals.title': 'Meal Planner',
      'household.maintenance.title': 'Home Maintenance',
      'household.travel.title': 'Travel Prep',
      'household.handover.title': 'Caregiver Handover',
    },
  },
});
