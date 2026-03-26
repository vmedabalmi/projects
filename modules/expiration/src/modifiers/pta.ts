import { addDays } from "../utils/dates";
import { PatentType } from "../types/index";
import type { PatentRecord } from "../types/index";

/**
 * Apply Patent Term Adjustment (PTA) to the expiration date.
 * PTA only applies to utility patents.
 *
 * Returns the adjusted date and the number of days added.
 */
export function applyPTA(
  currentDate: Date,
  record: PatentRecord
): { date: Date; daysAdded: number } {
  if (record.patentType !== PatentType.UTILITY) {
    return { date: currentDate, daysAdded: 0 };
  }

  if (!record.pta || record.pta.totalPTADays <= 0) {
    return { date: currentDate, daysAdded: 0 };
  }

  return {
    date: addDays(currentDate, record.pta.totalPTADays),
    daysAdded: record.pta.totalPTADays,
  };
}
