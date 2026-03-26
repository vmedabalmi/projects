import { addYears, maxDate, isBefore } from "../utils/dates";
import type { PatentRecord } from "../types/index";

/** June 8, 1995 — the GATT implementation date */
const GATT_CUTOFF = new Date("1995-06-08T00:00:00Z");

/**
 * Calculate base expiration for a utility patent.
 *
 * Post-GATT (filed >= June 8 1995): 20 years from filing date.
 * Pre-GATT (filed < June 8 1995):   MAX(17 years from grant, 20 years from filing).
 */
export function calculateUtilityExpiration(record: PatentRecord): Date {
  const twentyFromFiling = addYears(record.filingDate, 20);

  if (isBefore(record.filingDate, GATT_CUTOFF)) {
    const seventeenFromGrant = addYears(record.grantDate, 17);
    return maxDate(seventeenFromGrant, twentyFromFiling);
  }

  return twentyFromFiling;
}
