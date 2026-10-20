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
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import type { SkillSummary } from '@/lib/catalog';
import type { RiskClass } from '@/types/api';

interface SkillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (skill: SkillSummary) => void;
}

export function SkillFormModal({
  isOpen,
  onClose,
  onSuccess,
}: SkillFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<'health' | 'finance' | 'education' | 'household' | 'system'>('health');
  const [category, setCategory] = useState('clinical');
  const [riskClass, setRiskClass] = useState<RiskClass>('clinical_assist');
  const [guidelinesText, setGuidelinesText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const guidelines = guidelinesText
      .split('\n')
      .map((g) => g.trim())
      .filter(Boolean);

    const newSkill: SkillSummary = {
      id,
      title: title.trim(),
      domain,
      category,
      risk_class: riskClass,
      version: '1.0.0',
      description: description.trim() || 'Custom modular skill pack.',
      guidelines: guidelines.length > 0 ? guidelines : ['Ensure evidence-grounded responses.'],
    };

    onSuccess(newSkill);
    onClose();
    setTitle('');
    setDescription('');
    setGuidelinesText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Skill Pack</DialogTitle>
          <DialogDescription>
            Declare a modular clinical guideline, financial policy, or study framework.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
              Skill Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pediatric Fever Triage Guide"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              >
                <option value="health">Health & Clinical</option>
                <option value="finance">Finance & Bills</option>
                <option value="education">Education & Study</option>
                <option value="household">Household & Chores</option>
                <option value="system">System & Security</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Risk Classification
              </label>
              <select
                value={riskClass}
                onChange={(e) => setRiskClass(e.target.value as RiskClass)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              >
                <option value="clinical_assist">Clinical Assist</option>
                <option value="admin">Administrative</option>
                <option value="wellness">Wellness</option>
                <option value="education">Education</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope of this skill pack and clinical/operational principles..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
              Guidelines / Key Principles (one per line)
            </label>
            <textarea
              rows={3}
              value={guidelinesText}
              onChange={(e) => setGuidelinesText(e.target.value)}
              placeholder="1. Verify patient temperature history&#10;2. Check for emergency warning signs..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--cf-border)]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Skill
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
