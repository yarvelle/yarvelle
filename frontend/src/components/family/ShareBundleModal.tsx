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
import { Printer, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import type { HouseholdProfile } from '@/lib/familyProfiles';

export interface ShareBundleRecord {
  id: string;
  profileId: string;
  profileName: string;
  title: string;
  exportedAt: string;
}

export interface ShareBundleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profiles: HouseholdProfile[];
  onBundleExported?: (record: ShareBundleRecord) => void;
}

export function ShareBundleModal({
  open,
  onOpenChange,
  profiles,
  onBundleExported,
}: ShareBundleModalProps) {
  const [targetProfileId, setTargetProfileId] = useState(profiles[1]?.id || profiles[0]?.id || 'rosa');
  const [includeClinical, setIncludeClinical] = useState(true);
  const [includeEducation, setIncludeEducation] = useState(true);
  const [includeHandover, setIncludeHandover] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(false);

  const handleExport = () => {
    const profile = profiles.find((p) => p.id === targetProfileId) || profiles[0];
    const profileName = profile ? profile.name : 'Family member';

    const record: ShareBundleRecord = {
      id: `bundle-${Date.now()}`,
      profileId: targetProfileId,
      profileName,
      title: `${profileName} Comprehensive Care Packet`,
      exportedAt: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('yarvelle_share_bundles');
        const list = stored ? JSON.parse(stored) : [];
        list.push(record);
        window.localStorage.setItem('yarvelle_share_bundles', JSON.stringify(list));
      } catch {}
    }

    onBundleExported?.(record);
    onOpenChange(false);

    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Care & Education Packet</DialogTitle>
          <DialogDescription>
            Compile printable dossiers, medication lists, school forms, and emergency instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-[var(--cf-text-secondary)] mb-1">
              Select Household Member
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
              Dossier Sections to Include
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeClinical}
                  onChange={(e) => setIncludeClinical(e.target.checked)}
                  className="rounded border-[var(--cf-border)] text-[var(--cf-primary)]"
                />
                <span className="text-[var(--cf-text-primary)]">Clinical Visit Prep & Vitals Log</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEducation}
                  onChange={(e) => setIncludeEducation(e.target.checked)}
                  className="rounded border-[var(--cf-border)] text-[var(--cf-primary)]"
                />
                <span className="text-[var(--cf-text-primary)]">School Permissions & Academic Schedule</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHandover}
                  onChange={(e) => setIncludeHandover(e.target.checked)}
                  className="rounded border-[var(--cf-border)] text-[var(--cf-primary)]"
                />
                <span className="text-[var(--cf-text-primary)]">Caregiver Handover Binder & Emergency Contacts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded border-[var(--cf-border)] text-[var(--cf-primary)]"
                />
                <span className="text-[var(--cf-text-primary)]">Local Encrypted Reference Notes</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--cf-border)]">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleExport}>
              <Printer className="w-4 h-4 me-1.5" />
              Generate & Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
