import { minDate } from "../utils/dates";
import type { PatentRecord } from "../types/index";

/**
 * Apply terminal disclaimer: expiration is capped at the limiting date.
 *
 * Returns the adjusted date and whether the disclaimer was applied.
 */
export function applyTerminalDisclaimer(
  currentDate: Date,
  record: PatentRecord
): { date: Date; applied: boolean } {
  if (!record.terminalDisclaimer) {
    return { date: currentDate, applied: false };
  }

  const capped = minDate(currentDate, record.terminalDisclaimer.limitingDate);
  const applied = capped.getTime() < currentDate.getTime();

  return { date: capped, applied };
}
