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

interface NoteItem {
  id: string;
  title: string;
  body: string;
  scope: string;
}

const initialNotes: NoteItem[] = [
  {
    id: 'n-1',
    title: 'Pediatric Visit Prep Dossier',
    body: 'Questions for annual wellness checkup, immunization record update, and school physical form.',
    scope: 'health.clinical',
  },
  {
    id: 'n-2',
    title: 'Home HVAC Filter & Warranty Log',
    body: 'Replaced MERV-13 filter; compressor warranty active through 2029.',
    scope: 'household.maintenance',
  },
  {
    id: 'n-3',
    title: 'Parent-Teacher Conference Notes',
    body: 'Discuss science project milestones and reading streak goals.',
    scope: 'education.assignments',
  },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setNotes((prev) => [
      {
        id: `n-${Date.now()}`,
        title: title.trim(),
        body: body.trim() || 'Encrypted local note.',
        scope: 'household.notes',
      },
      ...prev,
    ]);
    setTitle('');
    setBody('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Notes & Dossiers</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Encrypted local notes, consultation prep records, and family reference binders.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes & dossiers..."
          data-testid="notes-search-input"
          className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        />
      </div>

      <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New note title..."
          data-testid="new-note-title"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Note content (stored under Argon2id envelope encryption)..."
            data-testid="new-note-body"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            data-testid="save-note-button"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition"
          >
            Save Note
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="notes-grid">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{note.title}</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {note.scope}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{note.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
