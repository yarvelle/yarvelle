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
import { FinanceClient } from './FinanceClient';

export const dynamic = 'force-dynamic';

interface FinancePageProps {
  params: Promise<{
    profileId: string;
  }>;
}

export default async function FinancePage({ params }: FinancePageProps) {
  const { profileId } = await params;
  return <FinanceClient profileId={profileId} />;
}
