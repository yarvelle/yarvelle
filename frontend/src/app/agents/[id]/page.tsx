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
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Shield,
  Sparkles,
  Bot,
  Wrench,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { findSpecialistById, getAllSpecialists } from '@/lib/catalog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllSpecialists().map((s) => ({ id: s.id }));
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;
  const specialist = findSpecialistById(id);

  if (!specialist) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      {/* Back button */}
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Specialists
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)] shrink-0">
              <Bot className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
                  {specialist.title}
                </h1>
                <Badge
                  variant={
                    specialist.domain === 'health'
                      ? 'danger'
                      : specialist.domain === 'finance'
                      ? 'success'
                      : specialist.domain === 'education'
                      ? 'info'
                      : 'neutral'
                  }
                  className="capitalize"
                >
                  {specialist.domain}
                </Badge>
                <Badge variant="neutral">
                  {specialist.risk_class.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-xs text-[var(--cf-text-muted)] font-mono">
                Identifier: {specialist.id} · Version: {specialist.version || '1.0.0'}
              </p>
            </div>
          </div>

          <Link href={`/chat?agent=${specialist.id}`}>
            <Button variant="primary" size="md">
              <MessageSquare className="w-4 h-4 me-1.5" />
              Consult Specialist
            </Button>
          </Link>
        </div>

        <p className="text-sm text-[var(--cf-text-secondary)] leading-relaxed">
          {specialist.description}
        </p>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conversation Starters */}
        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-[var(--cf-text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--cf-primary)]" />
            Suggested Consultation Prompts
          </h2>

          <div className="space-y-2">
            {(specialist.starters || ['How can I help you today?']).map((starter, i) => (
              <Link
                key={i}
                href={`/chat?agent=${specialist.id}&prompt=${encodeURIComponent(starter)}`}
                className="block p-3 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-muted)] text-xs text-[var(--cf-text-primary)] hover:border-[var(--cf-primary)] transition"
              >
                "{starter}"
              </Link>
            ))}
          </div>
        </div>

        {/* Required Skills & Boundaries */}
        <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-[var(--cf-text-primary)] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--cf-primary)]" />
            Provisioned Skill Packs
          </h2>

          <div className="space-y-2">
            {(specialist.skills || []).map((sk) => (
              <div
                key={sk}
                className="p-3 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-muted)] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--cf-primary)]" />
                  <span className="font-medium text-[var(--cf-text-primary)]">{sk}</span>
                </div>
                <Link
                  href={`/skills/${sk}`}
                  className="text-[10px] text-[var(--cf-primary)] hover:underline"
                >
                  View documentation &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
