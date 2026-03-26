import { addYears, isBefore } from "../utils/dates";
import type { PatentRecord } from "../types/index";

/** May 13, 2015 — design patent term change date */
const DESIGN_CUTOFF = new Date("2015-05-13T00:00:00Z");

/**
 * Calculate base expiration for a design patent.
 *
 * Filed >= May 13 2015: 15 years from filing date.
 * Filed <  May 13 2015: 14 years from grant date.
 */
export function calculateDesignExpiration(record: PatentRecord): Date {
  if (isBefore(record.filingDate, DESIGN_CUTOFF)) {
    return addYears(record.grantDate, 14);
  }
  return addYears(record.filingDate, 15);
}
