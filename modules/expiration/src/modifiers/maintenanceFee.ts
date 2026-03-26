import type { PatentRecord, MaintenanceFeeWindow } from "../types/index";

interface MaintenanceFeeLapseResult {
  date: Date;
  lapsed: boolean;
  lapseWindow?: MaintenanceFeeWindow;
}

/**
 * Check maintenance fee windows for lapse.
 *
 * If any window is unpaid and not revived, the patent expired at that
 * window's graceEnd date — only if graceEnd is before the current
 * calculated expiration.
 *
 * Returns the earliest lapse date if found.
 */
export function applyMaintenanceFeeLapse(
  currentDate: Date,
  record: PatentRecord
): MaintenanceFeeLapseResult {
  if (!record.maintenanceFees || record.maintenanceFees.length === 0) {
    return { date: currentDate, lapsed: false };
  }

  // Sort by deadline ascending to find the earliest lapse
  const sorted = [...record.maintenanceFees].sort(
    (a, b) => a.deadline.getTime() - b.deadline.getTime()
  );

  for (const fee of sorted) {
    if (!fee.paid && !fee.revived) {
      // Lapse at graceEnd, but only if it's before the calculated expiration
      if (fee.graceEnd.getTime() < currentDate.getTime()) {
        return {
          date: fee.graceEnd,
          lapsed: true,
          lapseWindow: fee.window,
        };
      }
    }
  }

  return { date: currentDate, lapsed: false };
}
