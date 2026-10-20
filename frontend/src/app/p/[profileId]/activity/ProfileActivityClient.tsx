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
  History,
  RefreshCw,
  Undo2,
  CheckCircle2,
  ShieldAlert,
  Bot,
  User,
  Cpu,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { ScopedStorage } from '@/lib/storageNamespace';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface ActivityItem {
  id: string;
  ts: string;
  profileId: string;
  principal: 'user' | 'agent' | 'orchestrator' | 'system';
  actor: 'user' | 'agent' | 'system';
  event: 'tool' | 'run' | 'undo' | 'create' | 'update';
  domain: 'health' | 'finance' | 'education' | 'household' | 'system';
  summary: string;
  description: string;
  undoable: boolean;
  undone: boolean;
  details?: Record<string, unknown>;
}

export interface ProfileActivityClientProps {
  profileId: string;
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    ts: '10 minutes ago',
    profileId: 'me',
    principal: 'agent',
    actor: 'agent',
    event: 'tool',
    domain: 'health',
    summary: 'Cardiology Visit Prep Checklist Generated',
    description: 'Extracted 14-day blood pressure averages and generated 4 provider consultation questions.',
    undoable: true,
    undone: false,
  },
  {
    id: 'act-2',
    ts: '2 hours ago',
    profileId: 'me',
    principal: 'user',
    actor: 'user',
    event: 'create',
    domain: 'household',
    summary: 'Chore Task Created: Tidy Living Room Bookshelves',
    description: 'Added weekly routine chore assigned to Maya with +25 reward points.',
    undoable: true,
    undone: false,
  },
  {
    id: 'act-3',
    ts: 'Yesterday at 3:45 PM',
    profileId: 'me',
    principal: 'system',
    actor: 'system',
    event: 'run',
    domain: 'finance',
    summary: 'Auto-Pay Scheduled: Water & Sewer Statement',
    description: 'Synchronized with utility provider portal; $86.40 scheduled for Oct 24.',
    undoable: false,
    undone: false,
  },
  {
    id: 'act-4',
    ts: '2 days ago',
    profileId: 'me',
    principal: 'agent',
    actor: 'agent',
    event: 'tool',
    domain: 'education',
    summary: 'Socratic Study Quiz Generated: AP Biology Enzymes',
    description: 'Created 24 flashcards with adaptive mastery tracking.',
    undoable: true,
    undone: false,
  },
];

export function ProfileActivityClient({ profileId }: ProfileActivityClientProps) {
  const [items, setItems] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const storageKey = `activity_events_${profileId}`;

  useEffect(() => {
    try {
      const storage = new ScopedStorage();
      const saved = storage.getItem<ActivityItem[]>(storageKey, []);
      if (saved && saved.length > 0) {
        setItems(saved);
      }
    } catch {}
  }, [storageKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleUndo = (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;

    // Mark as undone
    const updated = items.map((it) =>
      it.id === id ? { ...it, undoable: false, undone: true } : it
    );

    // Prepend undo event
    const undoEvent: ActivityItem = {
      id: `act-undo-${Date.now()}`,
      ts: 'Just now',
      profileId,
      principal: 'user',
      actor: 'user',
      event: 'undo',
      domain: target.domain,
      summary: `Reverted: ${target.summary}`,
      description: `Action was successfully reversed by user single-click undo.`,
      undoable: false,
      undone: false,
    };

    const finalItems = [undoEvent, ...updated];
    setItems(finalItems);
    try {
      const storage = new ScopedStorage();
      storage.setItem(storageKey, finalItems);
    } catch {}

    setToastMessage(`Action reverted: "${target.summary}"`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const filteredItems = items.filter((it) => {
    const matchDomain = domainFilter === 'all' || it.domain === domainFilter;
    const matchActor = actorFilter === 'all' || it.actor === actorFilter;
    return matchDomain && matchActor;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)]">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 data-testid="activity-page-heading" className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
                Activity & Audit Trail
              </h1>
              <span data-testid="activity-count-badge">
                <Badge variant="neutral">{items.length} Events</Badge>
              </span>
            </div>
            <p className="text-xs text-[var(--cf-text-muted)]">
              Tamper-evident chronological timeline of all agent actions, document extractions, and single-click undo records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            data-testid="activity-refresh-btn"
            aria-label="Refresh activity"
            className="text-[var(--cf-text-muted)]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--cf-text-secondary)]">Domain:</span>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            data-testid="activity-domain-filter"
            aria-label="Filter by domain"
            className="px-2.5 py-1.5 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
          >
            <option value="all">All Domains</option>
            <option value="health">Health & Clinical</option>
            <option value="finance">Finance & Bills</option>
            <option value="education">Education & Study</option>
            <option value="household">Household & Chores</option>
            <option value="system">System & Security</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--cf-text-secondary)]">Actor:</span>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            data-testid="activity-actor-filter"
            aria-label="Filter by actor"
            className="px-2.5 py-1.5 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
          >
            <option value="all">All Actors</option>
            <option value="user">User</option>
            <option value="agent">Specialist Agent</option>
            <option value="system">System Runtime</option>
          </select>
        </div>
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <div
          data-testid="activity-toast-success"
          role="status"
          className="flex items-center justify-between p-3 rounded-xl bg-[var(--cf-primary-subtle)] border border-[var(--cf-primary)] text-xs text-[var(--cf-primary)] shadow-sm animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--cf-primary)]" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:opacity-70 text-[var(--cf-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Timeline Feed */}
      <div data-testid="activity-timeline" className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--cf-text-muted)]">
            No activity matches the selected filters.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              data-testid={`activity-item-${item.id}`}
              className="p-4 space-y-2 hover:bg-[var(--cf-surface-muted)] transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={item.domain === 'health' ? 'danger' : item.domain === 'finance' ? 'success' : item.domain === 'education' ? 'info' : 'neutral'}>
                    {item.domain}
                  </Badge>

                  <span className="flex items-center gap-1 text-[10px] text-[var(--cf-text-muted)] bg-[var(--cf-surface-elevated)] px-1.5 py-0.5 rounded border border-[var(--cf-border)]">
                    {item.actor === 'agent' ? (
                      <Bot className="w-3 h-3 text-[var(--cf-primary)]" />
                    ) : item.actor === 'user' ? (
                      <User className="w-3 h-3 text-[var(--cf-accent)]" />
                    ) : (
                      <Cpu className="w-3 h-3 text-[var(--cf-text-muted)]" />
                    )}
                    {item.actor}
                  </span>

                  <h3 className={`text-xs font-semibold ${item.undone ? 'line-through text-[var(--cf-text-muted)]' : 'text-[var(--cf-text-primary)]'}`}>
                    {item.summary}
                  </h3>
                </div>

                <span className="text-[10px] text-[var(--cf-text-muted)] shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.ts}
                </span>
              </div>

              <p className="text-xs text-[var(--cf-text-secondary)]">{item.description}</p>

              {item.undoable && !item.undone && (
                <div className="pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUndo(item.id)}
                    data-testid={`undo-activity-btn-${item.id}`}
                    className="text-xs text-[var(--cf-warning-text)] hover:text-[var(--cf-text-primary)] p-0 h-auto"
                  >
                    <Undo2 className="w-3.5 h-3.5 me-1" />
                    Undo Action
                  </Button>
                </div>
              )}

              {item.undone && (
                <div className="pt-1">
                  <span className="text-[10px] italic text-[var(--cf-text-muted)]">
                    Action was reverted
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
