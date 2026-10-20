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
  BookOpen,
  Bookmark,
  Sparkles,
  FileCheck,
  Users,
  Clock,
  Check,
  ArrowUpRight,
} from 'lucide-react';

// Education Slot Components
export function AcademicCalendarCard({ profileId }: SlotProps) {
  const events = [
    {
      id: 'event-midterm',
      title: 'Midterm Science Assessment',
      subject: 'Earth Science',
      date: 'Oct 26',
      countdown: 'in 2 days',
      type: 'Exam',
      badgeVariant: 'warn' as const,
    },
    {
      id: 'event-conference',
      title: 'Parent-Educator Fall Conference',
      subject: 'All Classes',
      date: 'Nov 3',
      countdown: 'in 10 days',
      type: 'Conference',
      badgeVariant: 'info' as const,
    },
    {
      id: 'event-recess',
      title: 'Fall District Recess (No Classes)',
      subject: 'School Holiday',
      date: 'Nov 11',
      countdown: 'in 18 days',
      type: 'Holiday',
      badgeVariant: 'neutral' as const,
    },
    {
      id: 'event-project',
      title: 'History Research Exhibition',
      subject: 'World History',
      date: 'Nov 18',
      countdown: 'in 25 days',
      type: 'Project',
      badgeVariant: 'primary' as const,
    },
  ];

  return (
    <Card data-testid="education-calendar-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-info-bg text-info-fg">
              <Calendar className="h-4 w-4" />
            </span>
            <CardTitle>School Calendar & Events</CardTitle>
          </div>
          <Badge variant="info">Term 1 · Week 8</Badge>
        </div>
        <CardDescription>Class schedules, school holidays, exam blocks, and parent conferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Term Status Banner */}
        <div className="flex items-center justify-between rounded-md bg-surface-2 p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-fg">Fall Semester 2026</span>
          </div>
          <span className="font-semibold text-fg-muted">8 weeks remaining</span>
        </div>

        {/* Events List with Countdowns */}
        <div className="space-y-2">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface p-2.5 transition-colors hover:bg-surface-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-fg">{ev.title}</span>
                  <Badge variant={ev.badgeVariant}>{ev.type}</Badge>
                </div>
                <p className="text-xs text-fg-muted">
                  {ev.subject} · {ev.date}
                </p>
              </div>
              <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg-subtle">
                {ev.countdown}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">District calendar synced</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Full Schedule <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AssignmentsCard({ profileId }: SlotProps) {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    'asg-hist-1': true,
  });

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const assignments = [
    {
      id: 'asg-math-1',
      title: 'Polynomial Equations Problem Set',
      subject: 'Algebra II',
      subjectVariant: 'primary' as const,
      dueDate: 'Tomorrow, 5:00 PM',
      progress: '3 of 5 problems solved',
    },
    {
      id: 'asg-bio-1',
      title: 'Photosynthesis Lab Experiment Report',
      subject: 'Biology',
      subjectVariant: 'info' as const,
      dueDate: 'Thursday, Oct 29',
      progress: 'Drafting conclusion',
    },
    {
      id: 'asg-hist-1',
      title: 'Industrial Revolution Primary Source Analysis',
      subject: 'World History',
      subjectVariant: 'neutral' as const,
      dueDate: 'Monday, Nov 2',
      progress: 'Completed & reviewed',
    },
  ];

  return (
    <Card data-testid="education-assignments-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-success-bg text-success-fg">
              <BookOpen className="h-4 w-4" />
            </span>
            <CardTitle>Assignments & Due Dates</CardTitle>
          </div>
          <Badge variant="success">3 Active Tasks</Badge>
        </div>
        <CardDescription>Track homework deadlines and project milestones with academic integrity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md bg-surface-2 p-2">
            <p className="font-bold text-fg">2</p>
            <p className="text-fg-muted">Pending</p>
          </div>
          <div className="rounded-md bg-surface-2 p-2">
            <p className="font-bold text-success-fg">1</p>
            <p className="text-fg-muted">Done</p>
          </div>
          <div className="rounded-md bg-surface-2 p-2">
            <p className="font-bold text-fg">0</p>
            <p className="text-fg-muted">Overdue</p>
          </div>
        </div>

        {/* Task Rows */}
        <div className="space-y-2">
          {assignments.map((asg) => {
            const isDone = Boolean(completedTasks[asg.id]);
            return (
              <div
                key={asg.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface p-2.5 transition-colors hover:bg-surface-2"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleTask(asg.id)}
                    aria-label={`Mark ${asg.title} as ${isDone ? 'incomplete' : 'complete'}`}
                    className={`inline-flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                      isDone
                        ? 'border-primary bg-primary text-primary-fg'
                        : 'border-border-strong bg-surface text-transparent hover:border-primary'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isDone ? 'text-fg-muted line-through' : 'text-fg'}`}>
                        {asg.title}
                      </span>
                      <Badge variant={asg.subjectVariant}>{asg.subject}</Badge>
                    </div>
                    <p className="text-xs text-fg-muted">
                      Due: {asg.dueDate} · <span className="text-fg-subtle">{asg.progress}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">Socratic tutor mode enabled</span>
        <Button variant="ghost" size="sm" className="text-xs">
          View All Assignments <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ReadingLogCard({ profileId }: SlotProps) {
  const weekDays = [
    { day: 'M', label: 'Mon', completed: true, minutes: 30 },
    { day: 'T', label: 'Tue', completed: true, minutes: 25 },
    { day: 'W', label: 'Wed', completed: true, minutes: 35 },
    { day: 'T', label: 'Thu', completed: true, minutes: 30 },
    { day: 'F', label: 'Fri', completed: true, minutes: 40 },
    { day: 'S', label: 'Sat', completed: true, minutes: 20 },
    { day: 'S', label: 'Sun', completed: false, minutes: 0 },
  ];

  const totalMinutes = weekDays.reduce((acc, d) => acc + d.minutes, 0);
  const bookProgressPercent = 58;

  return (
    <Card data-testid="education-reading-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-warn-bg text-warn-fg">
              <BookOpen className="h-4 w-4" />
            </span>
            <CardTitle>Reading & Growth Log</CardTitle>
          </div>
          <Badge variant="warn">6-Day Streak</Badge>
        </div>
        <CardDescription>Track daily reading chapters, personal reflections, and milestone growth.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {/* 7-Day Streak Row - Zero child ranking, purely personal goal */}
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-fg">Weekly Reading Streak</span>
            <span className="font-semibold text-primary">{totalMinutes} mins logged</span>
          </div>
          <div className="flex items-center justify-between gap-1">
            {weekDays.map((d, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    d.completed
                      ? 'bg-primary text-primary-fg shadow-1'
                      : 'border border-border bg-surface-2 text-fg-muted'
                  }`}
                >
                  {d.completed ? <Check className="h-3.5 w-3.5" /> : d.day}
                </span>
                <span className="text-xs text-fg-subtle">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Book Reading */}
        <div className="rounded-md border border-border bg-surface-2 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-fg">The Phantom Tollbooth</p>
              <p className="text-xs text-fg-muted">by Norton Juster · Chapter 12 of 20</p>
            </div>
            <span className="text-xs font-bold text-primary">{bookProgressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              role="progressbar"
              aria-label="Current book reading progress"
              aria-valuenow={bookProgressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-full rounded-full bg-primary"
              style={{ width: `${bookProgressPercent}%` }}
            />
          </div>
          <p className="text-xs text-fg-subtle">148 of 256 pages completed</p>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">Goal: 20 mins / day</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Log Today's Reading <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function StudyQuizHelperCard({ profileId }: SlotProps) {
  const [selectedTopic, setSelectedTopic] = useState('Biology');
  const topics = ['Biology', 'Algebra', 'History', 'Vocabulary'];

  return (
    <Card data-testid="education-study-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary-soft-fg">
              <Sparkles className="h-4 w-4" />
            </span>
            <CardTitle>Practice Quizzes & Flashcards</CardTitle>
          </div>
          <Badge variant="primary">Socratic Mode</Badge>
        </div>
        <CardDescription>Interactive concept review, flashcards, and practice quiz exercises.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Subject Pills */}
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTopic(t)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTopic === t
                  ? 'bg-primary text-primary-fg'
                  : 'bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Interactive Flashcard Preview */}
        <div className="rounded-md border border-border bg-surface p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <Badge variant="outline">{selectedTopic} · Flashcard 4 of 15</Badge>
            <span className="text-fg-muted">Mastery: 85%</span>
          </div>
          <p className="text-sm font-medium text-fg">
            "What is the primary function of mitochondria during cellular metabolism?"
          </p>
          <div className="rounded bg-surface-2 p-2 text-xs text-fg-muted">
            <span className="font-semibold text-fg">Socratic Hint:</span> Think about where ATP synthesis takes place across the inner membrane.
          </div>
        </div>

        {/* Quick Quiz Launcher Action */}
        <div className="flex items-center justify-between rounded-md bg-surface-2 p-2.5">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-fg">5-Minute Quick Quiz</p>
            <p className="text-xs text-fg-muted">10 adaptive questions with step-by-step guidance</p>
          </div>
          <Button variant="primary" size="sm" className="text-xs">
            Start Quiz
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">Adaptive spaced repetition active</span>
        <Button variant="ghost" size="sm" className="text-xs">
          Open Study Deck <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SchoolFormsCard({ profileId }: SlotProps) {
  const forms = [
    {
      id: 'form-sports',
      title: 'Athletic & Sports Physical Clearance Waiver',
      term: 'Fall 2026 Season',
      status: 'Action Required',
      statusVariant: 'warn' as const,
      dueDate: 'Due Oct 27 (in 3 days)',
      action: 'Review & Sign',
    },
    {
      id: 'form-field-trip',
      title: 'Science Center Planetarium Field Trip Consent',
      term: 'Nov 14 Event',
      status: 'Signed & Submitted',
      statusVariant: 'success' as const,
      dueDate: 'Signed Oct 15 by Guardian',
      action: 'View PDF',
    },
    {
      id: 'form-emergency',
      title: 'Annual Emergency Contact & Medical Release',
      term: '2026–2027 Academic Year',
      status: 'Verified by School',
      statusVariant: 'info' as const,
      dueDate: 'Verified Sep 05',
      action: 'View Record',
    },
  ];

  return (
    <Card data-testid="education-forms-card" className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-warn-bg text-warn-fg">
              <FileCheck className="h-4 w-4" />
            </span>
            <CardTitle>School & Field Trip Forms</CardTitle>
          </div>
          <Badge variant="warn">1 Signature Needed</Badge>
        </div>
        <CardDescription>Guardian-reviewed drafts for permission slips, sports waivers, and registration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {forms.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border border-border bg-surface p-2.5 transition-colors hover:bg-surface-2"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-fg">{item.title}</span>
                <Badge variant={item.statusVariant}>{item.status}</Badge>
              </div>
              <p className="text-xs text-fg-muted">
                {item.term} · {item.dueDate}
              </p>
            </div>
            <Button
              variant={item.statusVariant === 'warn' ? 'primary' : 'outline'}
              size="sm"
              className="text-xs"
            >
              {item.action}
            </Button>
          </div>
        ))}
      </CardContent>
      <CardFooter className="justify-between border-t border-border pt-3">
        <span className="text-xs text-fg-muted">All forms encrypted locally on-device</span>
        <Button variant="ghost" size="sm" className="text-xs">
          All Forms Archive <ArrowUpRight className="ms-1 h-3.5 w-3.5" />
        </Button>
      </CardFooter>
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
