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
import { Lock, Copy, Check, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import {
  type HouseholdProfile,
  type ViewerInvite,
  createViewerInvite,
} from '@/lib/familyProfiles';

export interface ViewerInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: HouseholdProfile[];
  onInviteCreated?: (invite: ViewerInvite) => void;
}

export function ViewerInviteModal({
  open,
  onOpenChange,
  profiles,
  onInviteCreated,
}: ViewerInviteModalProps) {
  const [inviteeName, setInviteeName] = useState('');
  const [targetProfileId, setTargetProfileId] = useState(profiles[1]?.id || profiles[0]?.id || 'rosa');
  const [viewHealth, setViewHealth] = useState(true);
  const [viewFinance, setViewFinance] = useState(false);
  const [viewEducation, setViewEducation] = useState(false);
  const [viewHousehold, setViewHousehold] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState(30);

  const [generatedInvite, setGeneratedInvite] = useState<ViewerInvite | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeName.trim()) return;

    const targetProfile = profiles.find((p) => p.id === targetProfileId);
    const targetProfileName = targetProfile ? targetProfile.name : targetProfileId;

    const invite = await createViewerInvite(targetProfileId, {
      inviteeName: inviteeName.trim(),
      targetProfileName,
      viewHealth,
      viewFinance,
      viewEducation,
      viewHousehold,
      expiresInDays,
    });

    setGeneratedInvite(invite);
    onInviteCreated?.(invite);
  };

  const handleCopyCode = () => {
    if (!generatedInvite) return;
    navigator.clipboard?.writeText(generatedInvite.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setGeneratedInvite(null);
    setInviteeName('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Guest Viewer</DialogTitle>
          <DialogDescription>
            Generate a scoped, read-only invitation code for a healthcare proxy, tutor, or relative.
          </DialogDescription>
        </DialogHeader>

        {generatedInvite ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-muted)] text-center space-y-2">
              <span className="text-[10px] text-[var(--cf-text-muted)] uppercase tracking-wide font-bold">
                Invitation Access Code
              </span>
              <div className="font-mono text-xl font-bold text-[var(--cf-primary)]">
                {generatedInvite.inviteCode}
              </div>
              <p className="text-xs text-[var(--cf-text-secondary)]">
                Valid for {generatedInvite.inviteeName} · Expires in {generatedInvite.expiresInDays} days
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopyCode}>
                {copied ? <Check className="w-4 h-4 me-1" /> : <Copy className="w-4 h-4 me-1" />}
                {copied ? 'Copied' : 'Copy Code'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Invitee Name *
              </label>
              <input
                id="invitee-name-input"
                data-testid="invitee-name-input"
                type="text"
                required
                value={inviteeName}
                onChange={(e) => setInviteeName(e.target.value)}
                placeholder="e.g. Grandma Helen or Math Tutor"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Target Household Member
              </label>
              <select
                value={targetProfileId}
                onChange={(e) => setTargetProfileId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.relationship})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-2">
                Permitted Scopes
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viewHealth}
                    onChange={(e) => setViewHealth(e.target.checked)}
                    className="rounded border-[var(--cf-border)] text-[var(--cf-primary)]"
                  />
                  <span className="text-[var(--cf-text-primary)]">Health & Clinical Visit Prep</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viewFinance}
                    onChange={(e) => setViewFinance(e.target.checked)}
                    className="rounded border-[var(--cf-border)] text-[var(--cf-primary)]"
                  />
                  <span className="text-[var(--cf-text-primary)]">Finance & Statements</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viewEducation}
                    onChange={(e) => setViewEducation(e.target.checked)}
                    className="rounded border-[var(--cf-border)] text-[var(--cf-primary)]"
                  />
                  <span className="text-[var(--cf-text-primary)]">Education & Study Decks</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={viewHousehold}
                    onChange={(e) => setViewHousehold(e.target.checked)}
                    className="rounded border-[var(--cf-border)] text-[var(--cf-primary)]"
                  />
                  <span className="text-[var(--cf-text-primary)]">Household & Handover Binder</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
                Access Duration
              </label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] text-[var(--cf-text-primary)]"
              >
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--cf-border)]">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                data-testid="generate-invite-code-btn"
              >
                Generate Invite Code
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
