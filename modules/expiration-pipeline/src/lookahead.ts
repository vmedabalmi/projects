import type { LookaheadWindow } from "./types";

const DEFAULT_LOOKAHEAD_DAYS = [30, 60, 90];

/**
 * Parse LOOKAHEAD_DAYS environment variable.
 * Expected format: comma-separated integers, e.g. "30,60,90,180"
 */
export function getLookaheadDays(): number[] {
  const envVal = process.env.LOOKAHEAD_DAYS;
  if (!envVal) {
    return DEFAULT_LOOKAHEAD_DAYS;
  }

  const parsed = envVal
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n) && n > 0);

  return parsed.length > 0 ? parsed.sort((a, b) => a - b) : DEFAULT_LOOKAHEAD_DAYS;
}

/**
 * Build lookahead windows showing what date each window corresponds to
 * and whether the patent will have expired by that point.
 */
export function buildLookaheadWindows(
  daysUntilExpiration: number,
  now?: Date
): LookaheadWindow[] {
  const today = now ?? new Date();
  const lookaheadDays = getLookaheadDays();

  return lookaheadDays.map((days) => {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    const dateStr = futureDate.toISOString().split("T")[0];

    return {
      days,
      date: dateStr,
      isPastExpiration: days >= daysUntilExpiration,
    };
  });
}
