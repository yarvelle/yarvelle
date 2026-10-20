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
  Sparkles,
  Shield,
  BookOpen,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { getSkillById, getAllSkills } from '@/lib/catalog';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SkillDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllSkills().map((s) => ({ id: s.id }));
}

export default async function SkillDetailPage({ params }: SkillDetailPageProps) {
  const { id } = await params;
  const skill = getSkillById(id);

  if (!skill) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      <div>
        <Link
          href="/agents?tab=skills"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Skills Catalog
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--cf-primary-subtle)] flex items-center justify-center text-[var(--cf-primary)] shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold font-fraunces text-[var(--cf-text-primary)]">
                  {skill.title}
                </h1>
                <Badge
                  variant={
                    skill.domain === 'health'
                      ? 'danger'
                      : skill.domain === 'finance'
                      ? 'success'
                      : skill.domain === 'education'
                      ? 'info'
                      : 'neutral'
                  }
                  className="capitalize"
                >
                  {skill.domain}
                </Badge>
                <Badge variant="neutral">
                  {typeof skill.risk_class === 'string' ? skill.risk_class.replace('_', ' ') : 'Standard'}
                </Badge>
              </div>
              <p className="text-xs text-[var(--cf-text-muted)] font-mono">
                Identifier: {skill.id} · Version: {skill.version || '1.0.0'}
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-[var(--cf-text-secondary)] leading-relaxed">
          {skill.description}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--cf-border)] bg-[var(--cf-surface)] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-[var(--cf-text-primary)] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--cf-primary)]" />
          Guideline Specifications & Principles
        </h2>

        <div className="space-y-3">
          {(skill.guidelines || [
            'Ground all answers in local user documents and verified health guidelines.',
            'Never recommend changing drug prescriptions without licensed physician supervision.',
            'Maintain privacy-first on-device boundaries.',
          ]).map((guide, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-muted)] flex items-start gap-3 text-xs text-[var(--cf-text-primary)]"
            >
              <CheckCircle2 className="w-4 h-4 text-[var(--cf-primary)] shrink-0 mt-0.5" />
              <span>{guide}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
