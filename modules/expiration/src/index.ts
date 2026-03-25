export {
  PatentType,
  Confidence,
} from "./types/index";

export type {
  PatentRecord,
  ExpirationResult,
  ExpirationFactor,
} from "./types/index";

import { Confidence, PatentType } from "./types/index";
import type { PatentRecord, ExpirationResult, ExpirationFactor } from "./types/index";

const MS_PER_DAY = 86_400_000;

// Standard patent terms from filing date
const TERM_YEARS: Record<string, number> = {
  [PatentType.UTILITY]: 20,
  [PatentType.PLANT]: 20,
  [PatentType.DESIGN]: 15, // Design patents filed on/after May 13, 2015
};

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function addYears(dateStr: string, years: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split("T")[0];
}

/**
 * Calculate the expiration date for a patent based on its record.
 *
 * Rules:
 * - Utility/Plant: filing date + 20 years
 * - Design: filing date + 15 years (post-2015 applications)
 * - Add PTA days
 * - Add PTE days (if granted)
 * - Maintenance fee non-payment → early expiration
 */
export function calculateExpiration(record: PatentRecord): ExpirationResult {
  const factors: ExpirationFactor[] = [];
  let confidence = Confidence.HIGH;

  const termYears = TERM_YEARS[record.patentType] ?? TERM_YEARS[PatentType.UTILITY];

  // Base expiration: filing date + term
  const baseExpirationDate = addYears(record.filingDate, termYears);
  let expirationDate = baseExpirationDate;
  let totalAdjustedDays = 0;

  // PTA adjustment
  if (record.pta && record.pta.totalPTADays > 0) {
    expirationDate = addDays(expirationDate, record.pta.totalPTADays);
    totalAdjustedDays += record.pta.totalPTADays;
    factors.push({
      type: "PTA",
      description: `Patent Term Adjustment: +${record.pta.totalPTADays} days`,
      daysAdjusted: record.pta.totalPTADays,
    });
  }

  // PTE adjustment
  if (record.pte && record.pte.granted && record.pte.extensionDays > 0) {
    expirationDate = addDays(expirationDate, record.pte.extensionDays);
    totalAdjustedDays += record.pte.extensionDays;
    factors.push({
      type: "PTE",
      description: `Patent Term Extension: +${record.pte.extensionDays} days`,
      daysAdjusted: record.pte.extensionDays,
    });
  }

  // Terminal disclaimer — reduces confidence, exact date unknown without
  // the linked patent's expiration
  if (record.terminalDisclaimer) {
    confidence = Confidence.MEDIUM;
    factors.push({
      type: "TERMINAL_DISCLAIMER",
      description: "Terminal disclaimer filed — expiration may be tied to another patent",
      daysAdjusted: 0,
    });
  }

  // Maintenance fee lapse — early expiration
  if (record.maintenanceFees?.expired) {
    // Find the earliest unpaid fee window deadline
    const unpaidWindows = record.maintenanceFees.feeWindows
      .filter((fw) => !fw.paid)
      .sort((a, b) => new Date(a.graceEnd).getTime() - new Date(b.graceEnd).getTime());

    if (unpaidWindows.length > 0) {
      const lapseDate = unpaidWindows[0].graceEnd;
      if (new Date(lapseDate) < new Date(expirationDate)) {
        const lapseDays = Math.round(
          (new Date(expirationDate).getTime() - new Date(lapseDate).getTime()) / MS_PER_DAY
        );
        expirationDate = lapseDate;
        totalAdjustedDays -= lapseDays;
        factors.push({
          type: "MAINTENANCE_FEE_LAPSE",
          description: `Maintenance fee lapse — patent expired at grace period end: ${lapseDate}`,
          daysAdjusted: -lapseDays,
        });
      }
    }
    confidence = Confidence.HIGH; // Lapsed is definitive
  }

  // If we don't have enough data to be confident
  if (!record.filingDate || !record.grantDate) {
    confidence = Confidence.INDETERMINATE;
  }

  return {
    patentId: record.patentId,
    expirationDate,
    baseExpirationDate,
    adjustedDays: totalAdjustedDays,
    confidence,
    factors,
  };
}
