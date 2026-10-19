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

// Household Slot Components
export function UnifiedTimelineCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="household-timeline-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Unified Family Timeline</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Live</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Chronological family view spanning clinical visits, bill due dates, and school milestones.</p>
    </div>
  );
}

export function CrossDomainLinksCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="household-cross-links-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Cross-Domain Links & Alerts</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Active</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Connected entities across domains and family schedule conflict clusters.</p>
    </div>
  );
}

export function ChoresRotationCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="household-chores-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Chores & Routines</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Today</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Fair chore rotation, daily check-offs, and family routine streaks.</p>
    </div>
  );
}

export function MealPlannerCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="household-meals-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Weekly Meals & Grocery List</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Family meal schedules, allergen cross-checks, and grocery lists.</p>
    </div>
  );
}

export function HomeMaintenanceCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="household-maintenance-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Home Maintenance & Warranties</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Seasonal home checkups, appliance warranties, and service contractor logs.</p>
    </div>
  );
}

export function TravelItinerariesCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="household-travel-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Travel & Packing Lists</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Family vacation prep, packing checklists, and flight itineraries.</p>
    </div>
  );
}

export function CaregiverHandoverCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="household-handover-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Caregiver Handover Binder</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Emergency contacts, daily routines, and medical allergy notes for babysitters and family caregivers.</p>
    </div>
  );
}

export function PanelTogglesSection({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="household-panel-toggles">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Household Domain Toggles</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Enable or disable domain views (Health, Finance, Education, Household) per household member.</p>
    </div>
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
