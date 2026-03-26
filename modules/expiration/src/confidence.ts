import { ExpirationConfidence } from "./types/index";
import type { PatentRecord } from "./types/index";

/**
 * Determine confidence level and reasons for an expiration calculation.
 *
 * - INDETERMINATE: isInternational === true
 * - LOW: pte.pendingApplication === true
 * - MEDIUM: terminal disclaimer present, OR any fee in grace period (paid but late)
 * - HIGH: everything else
 */
export function assessConfidence(
  record: PatentRecord
): { confidence: ExpirationConfidence; reasons: string[] } {
  const reasons: string[] = [];

  if (record.isInternational) {
    reasons.push("International patent — expiration rules may differ by jurisdiction");
    return { confidence: ExpirationConfidence.INDETERMINATE, reasons };
  }

  if (record.pte?.pendingApplication) {
    reasons.push("PTE application pending — extension days may change");
    return { confidence: ExpirationConfidence.LOW, reasons };
  }

  if (record.terminalDisclaimer) {
    reasons.push("Terminal disclaimer filed — expiration tied to another patent");
    return { confidence: ExpirationConfidence.MEDIUM, reasons };
  }

  if (record.maintenanceFees) {
    const now = new Date();
    const inGracePeriod = record.maintenanceFees.some(
      (fee) =>
        !fee.paid &&
        !fee.revived &&
        fee.deadline.getTime() < now.getTime() &&
        fee.graceEnd.getTime() > now.getTime()
    );

    if (inGracePeriod) {
      reasons.push("Maintenance fee currently in grace period — may lapse");
      return { confidence: ExpirationConfidence.MEDIUM, reasons };
    }
  }

  reasons.push("All data available with no pending adjustments");
  return { confidence: ExpirationConfidence.HIGH, reasons };
}
