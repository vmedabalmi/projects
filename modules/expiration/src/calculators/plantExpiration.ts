import { addYears } from "../utils/dates";
import type { PatentRecord } from "../types/index";

/**
 * Calculate base expiration for a plant patent.
 *
 * Always 20 years from grant date.
 */
export function calculatePlantExpiration(record: PatentRecord): Date {
  return addYears(record.grantDate, 20);
}
