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

// Education Slot Components
export function AcademicCalendarCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="education-calendar-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">School Calendar & Events</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Term 1</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Class schedules, school holidays, exam blocks, and parent conferences.</p>
    </div>
  );
}

export function AssignmentsCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="education-assignments-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Assignments & Due Dates</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">In Progress</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Track homework deadlines and project milestones with academic integrity.</p>
    </div>
  );
}

export function ReadingLogCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="education-reading-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Reading & Growth Log</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">Streak Active</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">Track daily reading chapters, personal reflections, and milestone growth.</p>
    </div>
  );
}

export function StudyQuizHelperCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="education-study-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Practice Quizzes & Flashcards</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Interactive concept review, flashcards, and practice quiz exercises.</p>
    </div>
  );
}

export function SchoolFormsCard({ profileId }: SlotProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="education-forms-card">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">School & Field Trip Forms</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">Guardian-reviewed drafts for permission slips, sports waivers, and registration.</p>
    </div>
  );
}

export const educationSlotContributions: SlotContribution[] = [
  {
    id: 'education.calendar',
    pack: 'education',
    slot: 'dashboard.card',
    title: 'Academic Calendar',
    icon: 'Calendar',
    order: 10,
    route: '/education/calendar',
    requiredScopes: ['education.calendar'],
    audiences: ['adult', 'teen', 'child'],
    component: AcademicCalendarCard,
  },
  {
    id: 'education.assignments',
    pack: 'education',
    slot: 'dashboard.card',
    title: 'Assignments & Deadlines',
    icon: 'BookOpen',
    order: 20,
    route: '/education/assignments',
    requiredScopes: ['education.assignments'],
    audiences: ['adult', 'teen', 'child'],
    component: AssignmentsCard,
  },
  {
    id: 'education.reading',
    pack: 'education',
    slot: 'dashboard.card',
    title: 'Reading Log',
    icon: 'Bookmark',
    order: 30,
    route: '/education/reading',
    requiredScopes: ['education.reading'],
    audiences: ['adult', 'teen', 'child'],
    component: ReadingLogCard,
  },
  {
    id: 'education.study',
    pack: 'education',
    slot: 'dashboard.card',
    title: 'Study Quizzes',
    icon: 'Sparkles',
    order: 40,
    route: '/education/study',
    requiredScopes: ['education.assignments'],
    audiences: ['adult', 'teen', 'child'],
    component: StudyQuizHelperCard,
  },
  {
    id: 'education.forms',
    pack: 'education',
    slot: 'dashboard.card',
    title: 'School Forms & Slips',
    icon: 'FileCheck',
    order: 50,
    route: '/education/forms',
    requiredScopes: ['education.forms'],
    audiences: ['adult'],
    component: SchoolFormsCard,
  },
  {
    id: 'education.meetings',
    pack: 'education',
    slot: 'sidebar.item',
    title: 'Educator Meetings',
    icon: 'Users',
    order: 60,
    route: '/education/meetings',
    requiredScopes: ['education.assignments'],
    audiences: ['adult'],
  },
];

export const educationPackUi: PackUi = definePackUi({
  pack: 'education',
  contributions: educationSlotContributions,
  messages: {
    'en-US': {
      'education.calendar.title': 'Academic Calendar',
      'education.assignments.title': 'Assignments Tracker',
      'education.reading.title': 'Reading Log',
      'education.study.title': 'Study & Quiz Helper',
      'education.forms.title': 'School Forms & Waivers',
    },
  },
});
