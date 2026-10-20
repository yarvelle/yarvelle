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
import {
  Eye,
  Shield,
  User,
  Sparkles,
  MessageSquare,
  FileText,
  Edit3,
  ArrowRight,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  type HouseholdProfile,
  checkTeenHandoverStatus,
} from '@/lib/familyProfiles';
import { TeenHandoverBanner } from './TeenHandoverBanner';

export interface MemberCardProps {
  profile: HouseholdProfile;
  className?: string;
  onEdit?: (profile: HouseholdProfile) => void;
}

export function MemberCard({ profile, className, onEdit }: MemberCardProps) {
  const [handoverDismissed, setHandoverDismissed] = useState(false);
  const handoverStatus = checkTeenHandoverStatus(profile);

  const renderRoleBadge = () => {
    if (profile.role === 'self' || profile.relationship.toLowerCase() === 'self') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--cf-primary-subtle)] text-[var(--cf-primary)] border border-[var(--cf-primary)] whitespace-nowrap">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>Self · you</span>
        </span>
      );
    }

    if (profile.role === 'guardian') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--cf-primary-subtle)] text-[var(--cf-primary)] border border-[var(--cf-primary)] whitespace-nowrap">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>You manage</span>
        </span>
      );
    }

    if (profile.audience === 'child' || (profile.age !== undefined && profile.age < 13)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--cf-surface-muted)] text-[var(--cf-text-muted)] border border-[var(--cf-border)] whitespace-nowrap">
          <Shield className="w-3.5 h-3.5 text-[var(--cf-text-muted)] shrink-0" />
          <span>Child · no login</span>
        </span>
      );
    }

    if (profile.audience === 'teen' || (profile.age !== undefined && profile.age >= 13 && profile.age < 18)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--cf-primary-subtle)] text-[var(--cf-primary)] border border-[var(--cf-primary)] whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Teen login</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--cf-surface-elevated)] text-[var(--cf-warning-text)] border border-[var(--cf-border)] whitespace-nowrap">
        <Eye className="w-3.5 h-3.5 shrink-0" />
        <span>Viewer</span>
      </span>
    );
  };

  const chatsCount = profile.stats?.chats ?? 0;
  const itemsCount = profile.stats?.items ?? 0;

  return (
    <div
      data-testid={`member-card-${profile.id}`}
      className={cn(
        'p-5 rounded-2xl bg-[var(--cf-surface)] border border-[var(--cf-border)] shadow-xs flex flex-col justify-between gap-4 transition-all hover:border-[var(--cf-border-strong)]',
        className
      )}
    >
      <div className="space-y-3.5">
        {/* Top Header: Avatar + Name & Relationship */}
        <div className="flex items-center gap-3">
          <Avatar name={profile.name} src={profile.avatarUrl} colorSlot={profile.colorSlot} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-[var(--cf-text-primary)] leading-snug truncate">
              {profile.name}
            </h2>
            <p className="text-xs text-[var(--cf-text-muted)] truncate">
              {profile.relationship} {profile.age ? `· ${profile.age} yrs` : ''}
            </p>
          </div>
        </div>

        {/* Role Badges Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {renderRoleBadge()}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-[var(--cf-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--cf-text-muted)] shrink-0" />
            <span>{chatsCount} {chatsCount === 1 ? 'chat' : 'chats'}</span>
          </span>
          <span className="text-[var(--cf-border-strong)]">·</span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--cf-text-muted)] shrink-0" />
            <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
          </span>
        </div>

        {/* Scopes pill tags */}
        {profile.scopes && profile.scopes.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {profile.scopes.map((sc) => (
              <span
                key={sc}
                className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--cf-surface-muted)] text-[var(--cf-text-muted)] border border-[var(--cf-border)]"
              >
                {sc}
              </span>
            ))}
          </div>
        )}

        {/* Teen Handover Banner */}
        {!handoverDismissed && handoverStatus.shouldShowReminder && (
          <div className="pt-2">
            <TeenHandoverBanner
              profileId={profile.id}
              profileName={profile.name}
              status={handoverStatus}
              onDismissed={() => setHandoverDismissed(true)}
            />
          </div>
        )}
      </div>

      {/* Footer CTAs */}
      <div className="pt-3 border-t border-[var(--cf-border)] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onEdit?.(profile)}
          className="text-xs font-medium text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)] inline-flex items-center gap-1 transition"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit profile
        </button>

        <Link
          href={`/p/${profile.id}`}
          className="text-xs font-medium text-[var(--cf-primary)] hover:underline inline-flex items-center gap-1 transition"
        >
          Open dashboard &rarr;
        </Link>
      </div>
    </div>
  );
}
