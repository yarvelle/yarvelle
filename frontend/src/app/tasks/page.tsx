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

interface TaskEntry {
  id: string;
  title: string;
  pack: 'Household' | 'Education' | 'Finance' | 'Health';
  done: boolean;
}

const initialTasks: TaskEntry[] = [
  { id: 't-1', title: 'Clean kitchen counters & reset dishwasher', pack: 'Household', done: false },
  { id: 't-2', title: 'Biology science fair outline', pack: 'Education', done: false },
  { id: 't-3', title: 'Review monthly electric bill', pack: 'Finance', done: false },
  { id: 't-4', title: 'Prepare annual physical question checklist', pack: 'Health', done: true },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskEntry[]>(initialTasks);
  const [newTitle, setNewTitle] = useState('');
  const [newPack, setNewPack] = useState<TaskEntry['pack']>('Household');

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      ...prev,
      { id: `t-${Date.now()}`, title: trimmed, pack: newPack, done: false },
    ]);
    setNewTitle('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Tasks & Chores</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Household maintenance checklists, chore rotations, and academic assignment trackers.
        </p>
      </div>

      <form onSubmit={addTask} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a household task, chore, or assignment..."
          data-testid="new-task-input"
          className="flex-1 min-w-[220px] px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        />
        <select
          value={newPack}
          onChange={(e) => setNewPack(e.target.value as TaskEntry['pack'])}
          aria-label="Task domain"
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="Household">Household</option>
          <option value="Education">Education</option>
          <option value="Finance">Finance</option>
          <option value="Health">Health</option>
        </select>
        <button
          type="submit"
          data-testid="add-task-button"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition"
        >
          Add Task
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm" data-testid="task-list">
          {tasks.map((task) => (
            <li key={task.id} className="py-3 flex items-center justify-between gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span
                  className={
                    task.done
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-200'
                  }
                >
                  {task.title}
                </span>
              </label>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {task.pack}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
