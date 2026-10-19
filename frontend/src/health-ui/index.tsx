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

// Health UI Slot Components
export function VitalsCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="health-vitals-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Vitals & Biometrics</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Recorded</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Blood pressure, resting heart rate, glucose, and lab trends.</p>
    </div>
  );
}

export function AppointmentsCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="health-appointments-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Upcoming Care & Visits</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Scheduled</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Clinical specialist visits, prep dossiers, and follow-up checklists.</p>
    </div>
  );
}

export function PreventiveCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="health-preventive-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Preventive Guidelines</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">USPSTF preventive screenings, annual physicals, and immunization tracking.</p>
    </div>
  );
}

export function SchoolFormsCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="health-school-forms-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Health & Immunization Forms</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Vaccination records, sports physical clearance, and camp health forms.</p>
    </div>
  );
}

export function ClinicalConsentSection({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="health-consent-section">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Clinical Assist Consents</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Patient consent verification and non-clinical informational boundaries.</p>
    </div>
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
