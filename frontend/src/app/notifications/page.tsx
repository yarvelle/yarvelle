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
import Link from 'next/link';
import { Bell, CheckCircle2, AlertTriangle, ShieldCheck, Clock, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'conflict' | 'approval' | 'reminder';
  domain: 'health' | 'finance' | 'education' | 'household';
  time: string;
  link?: { label: string; href: string };
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Schedule Conflict Warning',
    description: 'Dr. Sarah Chen Cardiology Appointment overlaps with quarterly review on Thursday at 9:30 AM.',
    type: 'conflict',
    domain: 'health',
    time: '25 minutes ago',
    link: { label: 'Review Schedule', href: '/calendar' },
  },
  {
    id: 'n-2',
    title: 'Guardian Approval Requested',
    description: 'School Field Trip permission slip for Maya requires digital steward sign-off before Oct 28.',
    type: 'approval',
    domain: 'education',
    time: '2 hours ago',
    link: { label: 'Review Slip', href: '/p/maya/education' },
  },
  {
    id: 'n-3',
    title: 'Upcoming Bill Auto-Pay Notice',
    description: 'Metropolitan Water & Sewer auto-pay scheduled for $86.40 on Oct 24.',
    type: 'reminder',
    domain: 'finance',
    time: 'Yesterday',
    link: { label: 'View Bills', href: '/p/me/finance' },
  },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const dismissItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const markAllRead = () => {
    setItems([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)]">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">Notifications & Alerts</h1>
            <p className="text-xs text-[var(--cf-text-muted)] mt-0.5">
              Household conflict alerts, reminder digests, and two-guardian approval requests.
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-[var(--cf-text-muted)]">
            Mark all as read
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] divide-y divide-[var(--cf-border)] overflow-hidden shadow-xs">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--cf-text-muted)] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[var(--cf-primary)] mx-auto" />
            <p>All caught up! No pending guardian approvals or household conflict alerts.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-4 flex items-start justify-between gap-3 hover:bg-[var(--cf-surface-muted)] transition">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {item.type === 'conflict' ? (
                    <AlertTriangle className="w-4 h-4 text-[var(--cf-warning-text)]" />
                  ) : item.type === 'approval' ? (
                    <ShieldCheck className="w-4 h-4 text-[var(--cf-primary)]" />
                  ) : (
                    <Clock className="w-4 h-4 text-[var(--cf-accent)]" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={item.domain === 'health' ? 'danger' : item.domain === 'finance' ? 'success' : item.domain === 'education' ? 'info' : 'neutral'}>
                      {item.domain}
                    </Badge>
                    <h3 className="text-xs font-semibold text-[var(--cf-text-primary)]">{item.title}</h3>
                  </div>
                  <p className="text-xs text-[var(--cf-text-secondary)]">{item.description}</p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] text-[var(--cf-text-muted)]">{item.time}</span>
                    {item.link && (
                      <Link href={item.link.href} className="text-xs font-medium text-[var(--cf-primary)] hover:underline">
                        {item.link.label} &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => dismissItem(item.id)}
                aria-label="Dismiss notification"
                className="text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
