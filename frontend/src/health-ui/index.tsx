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

// Health UI Slot Components
export function VitalsCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="health-vitals-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vitals & Biometrics</CardTitle>
          <Badge variant="success">Recorded</Badge>
        </div>
        <CardDescription>Blood pressure, resting heart rate, glucose, and lab trends.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function AppointmentsCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="health-appointments-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Care & Visits</CardTitle>
          <Badge variant="info">Scheduled</Badge>
        </div>
        <CardDescription>Clinical specialist visits, prep dossiers, and follow-up checklists.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function PreventiveCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="health-preventive-card">
      <CardHeader>
        <CardTitle>Preventive Guidelines</CardTitle>
        <CardDescription>USPSTF preventive screenings, annual physicals, and immunization tracking.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function SchoolFormsCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="health-school-forms-card">
      <CardHeader>
        <CardTitle>Health & Immunization Forms</CardTitle>
        <CardDescription>Vaccination records, sports physical clearance, and camp health forms.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function ClinicalConsentSection({ profileId }: SlotProps) {
  return (
    <Card data-testid="health-consent-section">
      <CardHeader>
        <CardTitle>Clinical Assist Consents</CardTitle>
        <CardDescription>Patient consent verification and non-clinical informational boundaries.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export const healthSlotContributions: SlotContribution[] = [
  {
    id: 'health.vitals.card',
    pack: 'health',
    slot: 'dashboard.card',
    title: 'Vitals & Biometrics',
    icon: 'Activity',
    order: 10,
    route: '/vitals',
    requiredScopes: ['health.clinical'],
    audiences: ['adult', 'teen', 'viewer'],
    component: VitalsCard,
  },
  {
    id: 'health.appointments.card',
    pack: 'health',
    slot: 'dashboard.card',
    title: 'Upcoming Care & Visits',
    icon: 'Calendar',
    order: 20,
    route: '/appointments',
    requiredScopes: ['health.clinical'],
    audiences: ['adult', 'teen', 'viewer'],
    component: AppointmentsCard,
  },
  {
    id: 'health.preventive.card',
    pack: 'health',
    slot: 'dashboard.card',
    title: 'Preventive Care Guidelines',
    icon: 'ShieldCheck',
    order: 30,
    route: '/preventive',
    requiredScopes: ['health.clinical'],
    audiences: ['adult', 'teen'],
    component: PreventiveCard,
  },
  {
    id: 'health.school-forms.card',
    pack: 'health',
    slot: 'dashboard.card',
    title: 'School & Activity Forms',
    icon: 'FileText',
    order: 40,
    route: '/schedule',
    requiredScopes: ['health.clinical'],
    audiences: ['adult', 'teen'],
    component: SchoolFormsCard,
  },
  {
    id: 'health.dossier.renderer',
    pack: 'health',
    slot: 'chat.messageRenderer',
    title: 'Health Dossier Renderer',
    messageKind: 'health.dossier',
    requiredScopes: ['health.clinical', 'health.paperwork'],
  },
  {
    id: 'health.emergency.renderer',
    pack: 'health',
    slot: 'chat.messageRenderer',
    title: 'Emergency Red-Flag Escalation',
    messageKind: 'health.emergency',
    requiredScopes: ['health.clinical'],
  },
  {
    id: 'health.consent.gate',
    pack: 'health',
    slot: 'chat.beforeSend',
    title: 'Clinical Consent Gate',
    requiredScopes: ['health.clinical'],
  },
  {
    id: 'health.clinical-consent.settings',
    pack: 'health',
    slot: 'settings.section',
    title: 'Clinical Assist Consents',
    order: 50,
    requiredScopes: ['health.clinical'],
    component: ClinicalConsentSection,
  },
];

export const healthPackUi: PackUi = definePackUi({
  pack: 'health',
  contributions: healthSlotContributions,
  messages: {
    'en-US': {
      'health.vitals.title': 'Vitals & Biometrics',
      'health.appointments.title': 'Upcoming Appointments',
      'health.preventive.title': 'Preventive Care',
      'health.school-forms.title': 'School & Activity Forms',
      'health.emergency.title': 'Emergency Escalation',
    },
  },
});
