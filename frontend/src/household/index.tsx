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

// Household Slot Components
export function UnifiedTimelineCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="household-timeline-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Unified Family Timeline</CardTitle>
          <Badge variant="success">Live</Badge>
        </div>
        <CardDescription>Chronological family view spanning clinical visits, bill due dates, and school milestones.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function CrossDomainLinksCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="household-cross-links-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cross-Domain Links & Alerts</CardTitle>
          <Badge variant="warn">Active</Badge>
        </div>
        <CardDescription>Connected entities across domains and family schedule conflict clusters.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function ChoresRotationCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="household-chores-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Chores & Routines</CardTitle>
          <Badge variant="info">Today</Badge>
        </div>
        <CardDescription>Fair chore rotation, daily check-offs, and family routine streaks.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function MealPlannerCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="household-meals-card">
      <CardHeader>
        <CardTitle>Weekly Meals & Grocery List</CardTitle>
        <CardDescription>Family meal schedules, allergen cross-checks, and grocery lists.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function HomeMaintenanceCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="household-maintenance-card">
      <CardHeader>
        <CardTitle>Home Maintenance & Warranties</CardTitle>
        <CardDescription>Seasonal home checkups, appliance warranties, and service contractor logs.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function TravelItinerariesCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="household-travel-card">
      <CardHeader>
        <CardTitle>Travel & Packing Lists</CardTitle>
        <CardDescription>Family vacation prep, packing checklists, and flight itineraries.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function CaregiverHandoverCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="household-handover-card">
      <CardHeader>
        <CardTitle>Caregiver Handover Binder</CardTitle>
        <CardDescription>Emergency contacts, daily routines, and medical allergy notes for babysitters and family caregivers.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function PanelTogglesSection({ profileId }: SlotProps) {
  return (
    <Card data-testid="household-panel-toggles">
      <CardHeader>
        <CardTitle>Household Domain Toggles</CardTitle>
        <CardDescription>Enable or disable domain views (Health, Finance, Education, Household) per household member.</CardDescription>
      </CardHeader>
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
