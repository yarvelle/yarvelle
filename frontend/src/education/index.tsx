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

// Education Slot Components
export function AcademicCalendarCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="education-calendar-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>School Calendar & Events</CardTitle>
          <Badge variant="info">Term 1</Badge>
        </div>
        <CardDescription>Class schedules, school holidays, exam blocks, and parent conferences.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function AssignmentsCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="education-assignments-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assignments & Due Dates</CardTitle>
          <Badge variant="success">In Progress</Badge>
        </div>
        <CardDescription>Track homework deadlines and project milestones with academic integrity.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function ReadingLogCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="education-reading-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reading & Growth Log</CardTitle>
          <Badge variant="warn">Streak Active</Badge>
        </div>
        <CardDescription>Track daily reading chapters, personal reflections, and milestone growth.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function StudyQuizHelperCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="education-study-card">
      <CardHeader>
        <CardTitle>Practice Quizzes & Flashcards</CardTitle>
        <CardDescription>Interactive concept review, flashcards, and practice quiz exercises.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function SchoolFormsCard({ profileId }: SlotProps) {
  return (
    <Card data-testid="education-forms-card">
      <CardHeader>
        <CardTitle>School & Field Trip Forms</CardTitle>
        <CardDescription>Guardian-reviewed drafts for permission slips, sports waivers, and registration.</CardDescription>
      </CardHeader>
    </Card>
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
