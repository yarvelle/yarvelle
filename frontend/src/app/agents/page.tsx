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

import React, { Suspense } from 'react';
import { AgentsClient } from './AgentsClient';
import { getAllSpecialists, getAllSkills } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const specialists = getAllSpecialists();
  const skills = getAllSkills();

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--cf-text-muted)]">Loading Marketplace...</div>}>
      <AgentsClient
        initialAgents={specialists}
        initialSkills={skills}
      />
    </Suspense>
  );
}
