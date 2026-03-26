import { addDays } from "../utils/dates";
import type { PatentRecord } from "../types/index";

/** PTE is capped at 5 years (1825 days) */
const MAX_PTE_DAYS = 1825;

/**
 * Apply Patent Term Extension (PTE) to the expiration date.
 * PTE is only applied if granted. Extension days are capped at 1825.
 *
 * Returns the adjusted date and the number of days actually added.
 */
export function applyPTE(
  currentDate: Date,
  record: PatentRecord
): { date: Date; daysAdded: number } {
  if (!record.pte || !record.pte.granted || record.pte.extensionDays <= 0) {
    return { date: currentDate, daysAdded: 0 };
  }

  const cappedDays = Math.min(record.pte.extensionDays, MAX_PTE_DAYS);

  return {
    date: addDays(currentDate, cappedDays),
    daysAdded: cappedDays,
  };
}
