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
  GraduationCap,
  BookOpen,
  Flame,
  CheckSquare,
  Square,
  Plus,
  Brain,
  FileCheck,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { ScopedStorage } from '@/lib/storageNamespace';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';

export interface AcademicAssignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  daysRemaining: string;
  status: 'In Progress' | 'Submitted' | 'Due Soon';
  statusVariant: 'warning' | 'success' | 'info';
  completed: boolean;
}

export interface ReadingLogSession {
  streakDays: number;
  currentBook: {
    title: string;
    author: string;
    currentPage: number;
    totalPages: number;
  };
  weeklyMinutes: Record<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun', number>;
  goalMinutesPerDay: number;
}

export interface StudyQuizDeck {
  id: string;
  subject: string;
  topic: string;
  cardCount: number;
  masteryPercent: number;
}

export interface SchoolFormItem {
  id: string;
  title: string;
  studentName: string;
  dueDate: string;
  status: 'Pending Signature' | 'Completed' | 'Expiring';
  statusVariant: 'warning' | 'success' | 'neutral';
}

export interface EducationClientProps {
  profileId: string;
}

const DEFAULT_ASSIGNMENTS: AcademicAssignment[] = [
  {
    id: 'asg-1',
    title: 'Cellular Respiration & Photosynthesis Lab Report',
    subject: 'AP Biology',
    dueDate: 'Oct 23, 11:59 PM',
    daysRemaining: '3 days left',
    status: 'In Progress',
    statusVariant: 'warning',
    completed: false,
  },
  {
    id: 'asg-2',
    title: 'Trigonometric Identities Problem Set #4',
    subject: 'Pre-Calculus',
    dueDate: 'Oct 25, 8:00 AM',
    daysRemaining: '5 days left',
    status: 'Due Soon',
    statusVariant: 'info',
    completed: false,
  },
  {
    id: 'asg-3',
    title: 'The Great Gatsby Character Analysis Essay',
    subject: 'American Literature',
    dueDate: 'Oct 19, 5:00 PM',
    daysRemaining: 'Completed',
    status: 'Submitted',
    statusVariant: 'success',
    completed: true,
  },
];

const DEFAULT_READING: ReadingLogSession = {
  streakDays: 7,
  currentBook: {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    currentPage: 184,
    totalPages: 336,
  },
  weeklyMinutes: {
    Mon: 35,
    Tue: 30,
    Wed: 45,
    Thu: 40,
    Fri: 25,
    Sat: 50,
    Sun: 30,
  },
  goalMinutesPerDay: 30,
};

const DEFAULT_STUDY_DECKS: StudyQuizDeck[] = [
  { id: 'd-1', subject: 'AP Biology', topic: 'Enzyme Kinetics & ATP Synthesis', cardCount: 24, masteryPercent: 82 },
  { id: 'd-2', subject: 'US History', topic: 'Constitutional Convention & Amendments', cardCount: 36, masteryPercent: 68 },
  { id: 'd-3', subject: 'Spanish III', topic: 'Subjunctive Mood Conjugations', cardCount: 40, masteryPercent: 91 },
];

const DEFAULT_FORMS: SchoolFormItem[] = [
  {
    id: 'form-1',
    title: 'Annual Science Museum Field Trip Permission Slip',
    studentName: 'Maya',
    dueDate: 'Oct 28',
    status: 'Pending Signature',
    statusVariant: 'warning',
  },
  {
    id: 'form-2',
    title: 'Athletic Physical Clearance & Emergency Contact Form',
    studentName: 'Sam',
    dueDate: 'Nov 04',
    status: 'Completed',
    statusVariant: 'success',
  },
];

export function EducationClient({ profileId }: EducationClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'assignments' | 'reading' | 'study' | 'forms'>('all');
  const [assignments, setAssignments] = useState<AcademicAssignment[]>(DEFAULT_ASSIGNMENTS);
  const [reading, setReading] = useState<ReadingLogSession>(DEFAULT_READING);
  const [studyDecks] = useState<StudyQuizDeck[]>(DEFAULT_STUDY_DECKS);
  const [forms] = useState<SchoolFormItem[]>(DEFAULT_FORMS);
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);

  // Form state
  const [loggedMinutes, setLoggedMinutes] = useState('30');
  const [loggedPages, setLoggedPages] = useState('15');

  const assignmentsKey = `education_assignments_${profileId}`;
  const readingKey = `education_reading_${profileId}`;

  useEffect(() => {
    try {
      const storage = new ScopedStorage();
      const savedAsg = storage.getItem<AcademicAssignment[]>(assignmentsKey, []);
      if (savedAsg && savedAsg.length > 0) {
        setAssignments(savedAsg);
      }
      const savedReading = storage.getItem<ReadingLogSession>(readingKey, null);
      if (savedReading) {
        setReading(savedReading);
      }
    } catch {}
  }, [assignmentsKey, readingKey]);

  const toggleAssignment = (id: string) => {
    const updated = assignments.map((a) =>
      a.id === id ? { ...a, completed: !a.completed, status: (!a.completed ? 'Submitted' : 'In Progress') as AcademicAssignment['status'], statusVariant: (!a.completed ? 'success' : 'warning') as AcademicAssignment['statusVariant'] } : a
    );
    setAssignments(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(assignmentsKey, updated);
    } catch {}
  };

  const handleLogReading = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(loggedMinutes, 10) || 30;
    const pages = parseInt(loggedPages, 10) || 10;

    const newPage = Math.min(reading.currentBook.totalPages, reading.currentBook.currentPage + pages);
    const updated: ReadingLogSession = {
      ...reading,
      streakDays: reading.streakDays + 1,
      currentBook: {
        ...reading.currentBook,
        currentPage: newPage,
      },
      weeklyMinutes: {
        ...reading.weeklyMinutes,
        Sun: (reading.weeklyMinutes.Sun || 0) + mins,
      },
    };

    setReading(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(readingKey, updated);
    } catch {}

    setIsReadingModalOpen(false);
  };

  const toggleReadingDay = (day: keyof typeof reading.weeklyMinutes) => {
    const currentMins = reading.weeklyMinutes[day] || 0;
    const nextMins = currentMins > 0 ? 0 : 30;
    const nextWeekly = { ...reading.weeklyMinutes, [day]: nextMins };
    const activeDaysCount = Object.values(nextWeekly).filter((m) => m > 0).length;
    const updated: ReadingLogSession = {
      ...reading,
      weeklyMinutes: nextWeekly,
      streakDays: activeDaysCount,
    };
    setReading(updated);
    try {
      const storage = new ScopedStorage();
      storage.setItem(readingKey, updated);
    } catch {}
  };

  const pendingAssignmentsCount = assignments.filter((a) => !a.completed).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 data-testid="education-page-heading" className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              Education & Study
            </h1>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Academic assignments, reading streak logs, Socratic study quizzes, and school forms.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsReadingModalOpen(true)}
            data-testid="log-reading-btn"
          >
            <BookOpen className="w-4 h-4 me-1.5" />
            Log Reading
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div data-testid="education-tabs" className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--cf-border)]">
        {(['all', 'assignments', 'reading', 'study', 'forms'] as const).map((tab) => (
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

      {/* Academic Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-[var(--cf-text-muted)] font-medium">Daily Reading Streak</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
              {reading.streakDays} Days
            </span>
            <div data-testid="reading-streak-badge">
              <Badge variant="warning" className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current text-[var(--cf-warning-text)]" />
                Streak Active
              </Badge>
            </div>
          </div>
          <span className="text-[10px] text-[var(--cf-text-muted)]">Goal: 30 min/day</span>
        </div>

        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-[var(--cf-text-muted)] font-medium">Assignments Due</span>
          <div className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            {pendingAssignmentsCount}
          </div>
          <span className="text-[10px] text-[var(--cf-text-muted)]">Next: Biology Lab in 3 days</span>
        </div>

        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-[var(--cf-text-muted)] font-medium">Flashcard Mastery</span>
          <div className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            80.3%
          </div>
          <span className="text-[10px] text-[var(--cf-text-muted)]">Across 3 active study decks</span>
        </div>

        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-1.5">
          <span className="text-xs text-[var(--cf-text-muted)] font-medium">School Documents</span>
          <div className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
            1 Pending
          </div>
          <span className="text-[10px] text-[var(--cf-text-muted)]">Science Museum slip due Oct 28</span>
        </div>
      </div>

      {/* Section 1: Assignments Tracker */}
      {(activeTab === 'all' || activeTab === 'assignments') && (
        <div data-testid="education-assignments-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Coursework & Assignments</h2>
            <span className="text-xs text-[var(--cf-text-muted)]">{assignments.length} total tasks</span>
          </div>

          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs">
            {assignments.map((asg) => (
              <div key={asg.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[var(--cf-surface-muted)] transition">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleAssignment(asg.id)}
                    data-testid={`assignment-toggle-${asg.id}`}
                    aria-label={`Toggle assignment ${asg.title}`}
                    className="mt-0.5 text-[var(--cf-primary)] shrink-0"
                  >
                    {asg.completed ? (
                      <CheckSquare className="w-5 h-5 text-[var(--cf-primary)]" />
                    ) : (
                      <Square className="w-5 h-5 text-[var(--cf-border-strong)]" />
                    )}
                  </button>
                  <div>
                    <h3 className={`text-xs font-semibold ${asg.completed ? 'line-through text-[var(--cf-text-muted)]' : 'text-[var(--cf-text-primary)]'}`}>
                      {asg.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--cf-surface-elevated)] border border-[var(--cf-border)] text-[var(--cf-text-muted)]">
                        {asg.subject}
                      </span>
                      <span className="text-[10px] text-[var(--cf-text-muted)] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Due {asg.dueDate} ({asg.daysRemaining})
                      </span>
                    </div>
                  </div>
                </div>

                <Badge variant={asg.statusVariant}>{asg.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: 7-Day Reading Log */}
      {(activeTab === 'all' || activeTab === 'reading') && (
        <div data-testid="education-reading-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">7-Day Reading Log & Book Progress</h2>
            <span className="text-xs text-[var(--cf-text-muted)]">Target: 30 minutes daily</span>
          </div>

          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 space-y-6 shadow-xs">
            {/* Book Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--cf-border)] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--cf-primary)] tracking-wide">Currently Reading</span>
                <h3 className="text-sm font-bold text-[var(--cf-text-primary)] mt-0.5">{reading.currentBook.title}</h3>
                <p className="text-xs text-[var(--cf-text-muted)]">by {reading.currentBook.author}</p>
              </div>
              <div className="w-full sm:w-64 space-y-1.5 text-end">
                <div className="flex justify-between text-xs text-[var(--cf-text-secondary)]">
                  <span>Page {reading.currentBook.currentPage}</span>
                  <span>{reading.currentBook.totalPages} pages</span>
                </div>
                <div className="w-full bg-[var(--cf-surface-muted)] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[var(--cf-primary)] h-2 rounded-full"
                    style={{ width: `${(reading.currentBook.currentPage / reading.currentBook.totalPages) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weekly Days Bar Chart */}
            <div>
              <span className="text-xs font-semibold text-[var(--cf-text-secondary)]">Minutes Read this Week</span>
              <div className="grid grid-cols-7 gap-2 pt-3 text-center">
                {(Object.entries(reading.weeklyMinutes) as [keyof typeof reading.weeklyMinutes, number][]).map(([day, mins]) => (
                  <button
                    key={day}
                    type="button"
                    data-testid={`streak-day-toggle-${day}`}
                    onClick={() => toggleReadingDay(day)}
                    className="flex flex-col items-center gap-1.5 p-1 rounded-lg hover:bg-[var(--cf-surface-muted)] transition cursor-pointer"
                  >
                    <span className="text-[10px] font-semibold text-[var(--cf-primary)]">{mins}m</span>
                    <div className="w-full h-16 bg-[var(--cf-surface-muted)] rounded-lg flex items-end justify-center p-1">
                      <div
                        className="w-full bg-[var(--cf-primary)] rounded transition-all"
                        style={{ height: `${Math.min(100, (mins / 50) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--cf-text-muted)]">{day}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Socratic Study Decks */}
      {(activeTab === 'all' || activeTab === 'study') && (
        <div data-testid="education-study-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">Socratic Study Decks & Concept Mastery</h2>
              <p className="text-xs text-[var(--cf-text-muted)]">Autonomous practice quizzes powered by Study Companion.</p>
            </div>
            <Link href="/chat?agent=study-companion">
              <Button variant="primary" size="sm" data-testid="launch-study-session-btn">
                <Brain className="w-4 h-4 me-1.5" />
                Launch Study Session
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studyDecks.map((deck) => (
              <div key={deck.id} className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="info">{deck.subject}</Badge>
                  <span className="text-[var(--cf-text-muted)]">{deck.cardCount} flashcards</span>
                </div>
                <h3 className="text-xs font-semibold text-[var(--cf-text-primary)] leading-snug">{deck.topic}</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-[var(--cf-text-muted)]">
                    <span>Mastery Level</span>
                    <span className="font-semibold text-[var(--cf-primary)]">{deck.masteryPercent}%</span>
                  </div>
                  <div className="w-full bg-[var(--cf-surface-muted)] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[var(--cf-primary)] h-1.5 rounded-full" style={{ width: `${deck.masteryPercent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4: School Forms & Permission Slips */}
      {(activeTab === 'all' || activeTab === 'forms') && (
        <div data-testid="education-forms-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--cf-text-primary)]">School Permission Slips & Forms</h2>
            <span className="text-xs text-[var(--cf-text-muted)]">{forms.length} records</span>
          </div>

          <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs">
            {forms.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[var(--cf-surface-muted)] transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--cf-surface-muted)] flex items-center justify-center text-[var(--cf-primary)] shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{item.title}</h3>
                    <p className="text-[10px] text-[var(--cf-text-muted)] mt-0.5">
                      Student: {item.studentName} · Due by {item.dueDate}
                    </p>
                  </div>
                </div>
                <Badge variant={item.statusVariant}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Reading Modal */}
      <Dialog open={isReadingModalOpen} onOpenChange={setIsReadingModalOpen}>
        <DialogContent data-testid="log-reading-modal" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Reading Session</DialogTitle>
            <DialogDescription>
              Record minutes read and update current book page count.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogReading} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Minutes Read Today *
              </label>
              <input
                type="number"
                required
                value={loggedMinutes}
                onChange={(e) => setLoggedMinutes(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Pages Completed
              </label>
              <input
                type="number"
                value={loggedPages}
                onChange={(e) => setLoggedPages(e.target.value)}
                placeholder="15"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsReadingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Session
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
