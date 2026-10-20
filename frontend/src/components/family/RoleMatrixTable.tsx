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
  Shield,
  ShieldCheck,
  Check,
  X,
  HeartPulse,
  Wallet,
  GraduationCap,
  Home,
  User,
  Users,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { loadHouseholdProfiles, type HouseholdProfile } from '@/lib/familyProfiles';
import { cn } from '@/lib/utils';

export interface RoleMatrixTableProps {
  profiles?: HouseholdProfile[];
  className?: string;
}

interface CapabilityDefinition {
  key: string;
  label: string;
  domain: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CAPABILITIES: CapabilityDefinition[] = [
  {
    key: 'manage',
    label: 'Household Stewardship',
    domain: 'Administration',
    icon: ShieldCheck,
    description: 'Add or remove members, configure model keys, export complete backups.',
  },
  {
    key: 'health',
    label: 'Health & Clinical Vitals',
    domain: 'Health',
    icon: HeartPulse,
    description: 'Consult clinical specialists, log blood pressure & glucose, prepare visit checklists.',
  },
  {
    key: 'finance',
    label: 'Finance & Medical Bridge',
    domain: 'Finance',
    icon: Wallet,
    description: 'Track household bills, view EOB claims, manage deductible & HSA meters.',
  },
  {
    key: 'education',
    label: 'Education & Study Decks',
    domain: 'Education',
    icon: GraduationCap,
    description: 'View academic assignments, log 7-day reading streak, launch Socratic study quizzes.',
  },
  {
    key: 'household',
    label: 'Household & Chores',
    domain: 'Household',
    icon: Home,
    description: 'Assign chore points, plan 7-day family meals, maintain home equipment logs.',
  },
];

export function RoleMatrixTable({ profiles: profilesProp, className }: RoleMatrixTableProps) {
  const [household, setHousehold] = useState<HouseholdProfile[]>(() => profilesProp || []);

  useEffect(() => {
    if (profilesProp !== undefined) {
      setHousehold(profilesProp);
    } else {
      setHousehold(loadHouseholdProfiles());
    }
  }, [profilesProp]);

  const members = profilesProp !== undefined ? profilesProp : household;

  const hasAccess = (profile: HouseholdProfile, capKey: string): boolean => {
    if (profile.role === 'self' || profile.relationship.toLowerCase() === 'self') {
      return true;
    }
    if (profile.role === 'guardian') {
      return true;
    }
    if (profile.audience === 'teen') {
      // Teens have study, household, personal health, but no full finance stewardship
      return capKey === 'education' || capKey === 'household' || capKey === 'health';
    }
    if (profile.audience === 'child') {
      // Dependent youth accounts only access study and household chore tasks
      return capKey === 'education' || capKey === 'household';
    }
    if (profile.role === 'viewer') {
      return capKey === 'health';
    }
    return false;
  };

  return (
    <div
      data-testid="role-matrix-section"
      className={cn(
        'rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] p-6 shadow-xs space-y-6',
        className
      )}
    >
      <div>
        <h2 className="text-base font-bold font-fraunces text-[var(--cf-text-primary)]">
          Household Access Governance Matrix
        </h2>
        <p className="text-xs text-[var(--cf-text-muted)] mt-1">
          Role-based capability permissions across Health, Finance, Education, and Household packs.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table data-testid="role-matrix-table" className="w-full text-xs text-start">
          <thead className="bg-[var(--cf-surface-muted)] text-[var(--cf-text-muted)] border-b border-[var(--cf-border)]">
            <tr>
              <th className="py-3 px-4 font-semibold text-start min-w-[200px]">
                Domain Capability
              </th>
              {members.map((m) => (
                <th key={m.id} className="py-3 px-4 font-semibold text-center min-w-[120px]">
                  <div className="flex flex-col items-center gap-1.5">
                    <Avatar name={m.name} size="sm" colorSlot={m.colorSlot} />
                    <span className="font-semibold text-[var(--cf-text-primary)]">{m.name}</span>
                    <span className="text-[10px] text-[var(--cf-text-muted)]">
                      {m.role === 'self'
                        ? 'Self'
                        : m.audience === 'child'
                        ? 'Child'
                        : m.audience === 'teen'
                        ? 'Teen'
                        : m.role === 'guardian'
                        ? 'Guardian'
                        : 'Member'}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--cf-border)] text-[var(--cf-text-primary)]">
            {CAPABILITIES.map((cap) => {
              const IconComp = cap.icon;
              return (
                <tr key={cap.key} className="hover:bg-[var(--cf-surface-muted)] transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[var(--cf-surface-muted)] flex items-center justify-center text-[var(--cf-primary)] shrink-0">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-[var(--cf-text-primary)] block">
                          {cap.label}
                        </span>
                        <span className="text-[10px] text-[var(--cf-text-muted)]">
                          {cap.description}
                        </span>
                      </div>
                    </div>
                  </td>
                  {members.map((m) => {
                    const allowed = hasAccess(m, cap.key);
                    return (
                      <td key={m.id} className="py-3.5 px-4 text-center">
                        {allowed ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--cf-primary-subtle)] text-[var(--cf-primary)] mx-auto">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--cf-surface-muted)] text-[var(--cf-text-muted)] mx-auto opacity-40">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
