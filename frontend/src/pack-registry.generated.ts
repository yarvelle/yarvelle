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

import { healthPackUi } from '@spectrayan/carefold';
import { financePackUi } from '@/finance';
import { educationPackUi } from '@/education';
import { householdPackUi } from '@/household';
import type { PackUi, SlotContribution, SlotId, FilterSlotsOptions } from '@yarvelle/ui/slots';
import { filterSlotContributions } from '@yarvelle/ui/slots';

export { filterSlotContributions, type FilterSlotsOptions };

export const allPacks: PackUi[] = [
  healthPackUi,
  financePackUi,
  educationPackUi,
  householdPackUi,
];

export const packsMap: Record<string, PackUi> = {
  health: healthPackUi,
  finance: financePackUi,
  education: educationPackUi,
  household: householdPackUi,
};

export function getPackUi(packId: string): PackUi | undefined {
  return packsMap[packId];
}

export function getAllSlotContributions(): SlotContribution[] {
  return allPacks.flatMap((p) => p?.contributions || []).filter(Boolean);
}

export function getSlotsFor(slot: SlotId): SlotContribution[] {
  return getAllSlotContributions()
    .filter((c) => c.slot === slot)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function getFilteredSlots(options: FilterSlotsOptions): SlotContribution[] {
  return filterSlotContributions(getAllSlotContributions(), options);
}
