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
import { Bot, Check, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import type { AgentSummary, RiskClass } from '@/types/api';
import type { SkillSummary } from '@/lib/catalog';

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agent: AgentSummary) => void;
  availableSkills?: SkillSummary[];
}

export function AgentFormModal({
  isOpen,
  onClose,
  onSuccess,
  availableSkills = [],
}: AgentFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState<'health' | 'finance' | 'education' | 'household'>('health');
  const [category, setCategory] = useState('general');
  const [riskClass, setRiskClass] = useState<RiskClass>('clinical_assist');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [startersText, setStartersText] = useState('');

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const starters = startersText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newAgent: AgentSummary = {
      id,
      title: title.trim(),
      domain,
      category,
      risk_class: riskClass,
      maturity: 'experimental',
      version: '0.1.0',
      description: description.trim() || 'Custom household specialist agent.',
      skills: selectedSkills,
      effectiveTools: ['attach-read', 'workspace-note', 'skill-docs'],
      starters: starters.length > 0 ? starters : ['How can you help me today?'],
      care_stages: ['pre_visit', 'daily_living'],
      target_audience: ['adult', 'teen', 'caregivers'],
    };

    onSuccess(newAgent);
    onClose();
    setTitle('');
    setDescription('');
    setStartersText('');
    setSelectedSkills([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Specialist</DialogTitle>
          <DialogDescription>
            Configure a specialized AI assistant with custom skills and prompt boundaries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
              Specialist Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pediatric Asthma Coach"
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
              Description & Purpose
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary responsibilities and navigational guidelines..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
              Conversation Starters (one per line)
            </label>
            <textarea
              rows={2}
              value={startersText}
              onChange={(e) => setStartersText(e.target.value)}
              placeholder="What questions should I bring to my next consultation?&#10;Help me log symptoms..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)] resize-none"
            />
          </div>

          {availableSkills.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1.5">
                Attached Skill Packs
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 border border-[var(--cf-border)] rounded-xl bg-[var(--cf-surface-muted)]">
                {availableSkills.slice(0, 15).map((sk) => (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => toggleSkill(sk.id)}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition flex items-center gap-1 ${
                      selectedSkills.includes(sk.id)
                        ? 'bg-[var(--cf-primary)] text-[var(--cf-primary-contrast)] border-[var(--cf-primary)]'
                        : 'bg-[var(--cf-surface)] text-[var(--cf-text-secondary)] border-[var(--cf-border)]'
                    }`}
                  >
                    {selectedSkills.includes(sk.id) && <Check className="w-3 h-3" />}
                    {sk.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--cf-border)]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Specialist
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
