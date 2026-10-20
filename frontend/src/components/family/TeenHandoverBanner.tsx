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

import React from 'react';
import { AlertCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  type TeenHandoverStatus,
  dismissTeenHandoverReminder,
} from '@/lib/familyProfiles';

export interface TeenHandoverBannerProps {
  profileId: string;
  profileName: string;
  status: TeenHandoverStatus;
  onDismissed?: () => void;
  className?: string;
}

export function TeenHandoverBanner({
  profileId,
  profileName,
  status,
  onDismissed,
  className,
}: TeenHandoverBannerProps) {
  if (!status.shouldShowReminder) return null;

  const firstName = profileName.split(' ')[0];

  const handleDismiss = () => {
    dismissTeenHandoverReminder(profileId);
    onDismissed?.();
  };

  return (
    <div
      role="region"
      aria-label={`Teen transition notice for ${profileName}`}
      data-testid={`teen-handover-banner-${profileId}`}
      className={cn(
        'p-3.5 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface-elevated)] text-[var(--cf-text-primary)] text-xs space-y-2.5',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-[var(--cf-warning-text)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[var(--cf-text-primary)]">
            {status.hasReached18
              ? `${firstName} has reached legal independence (age 18)`
              : `${firstName} is approaching age 18 (${status.daysRemaining} days remaining)`}
          </p>
          <p className="text-[11px] text-[var(--cf-text-secondary)] leading-relaxed">
            {status.hasReached18
              ? `${firstName} can now transition to an independent Yarvelle account. Adult health and financial records require personal authorization.`
              : `Prepare to transfer account stewardship or export historical health and education records before legal adulthood.`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          className="text-xs"
        >
          <UserCheck className="w-3.5 h-3.5 me-1" />
          Transfer Stewardship
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-xs text-[var(--cf-text-muted)] hover:text-[var(--cf-text-primary)]"
        >
          Remind in 30 days
        </Button>
      </div>
    </div>
  );
}
