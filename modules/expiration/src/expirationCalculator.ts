import { PatentType } from "./types/index";
import type { PatentRecord, ExpirationResult, ExpirationBreakdown } from "./types/index";
import { calculateUtilityExpiration } from "./calculators/utilityExpiration";
import { calculateDesignExpiration } from "./calculators/designExpiration";
import { calculatePlantExpiration } from "./calculators/plantExpiration";
import { applyPTA } from "./modifiers/pta";
import { applyPTE } from "./modifiers/pte";
import { applyTerminalDisclaimer } from "./modifiers/terminalDisclaimer";
import { applyMaintenanceFeeLapse } from "./modifiers/maintenanceFee";
import { assessConfidence } from "./confidence";

/**
 * Calculate the base expiration date based on patent type.
 */
function calculateBaseExpiration(record: PatentRecord): Date {
  switch (record.patentType) {
    case PatentType.UTILITY:
      return calculateUtilityExpiration(record);
    case PatentType.DESIGN:
      return calculateDesignExpiration(record);
    case PatentType.PLANT:
      return calculatePlantExpiration(record);
    default:
      return calculateUtilityExpiration(record);
  }
}

/**
 * Calculate patent expiration with full breakdown.
 *
 * Modifiers are applied in order:
 * 1. PTA (utility only)
 * 2. PTE (capped at 1825 days)
 * 3. Terminal disclaimer (MIN with limiting date)
 * 4. Maintenance fee lapse (earliest unpaid, unrevived window)
 */
export function calculateExpiration(record: PatentRecord): ExpirationResult {
  // Step 1: Base expiration
  const baseExpirationDate = calculateBaseExpiration(record);

  // Step 2: Apply PTA
  const ptaResult = applyPTA(baseExpirationDate, record);
  const afterPTA = ptaResult.date;

  // Step 3: Apply PTE
  const pteResult = applyPTE(afterPTA, record);
  const afterPTE = pteResult.date;

  // Step 4: Apply terminal disclaimer
  const tdResult = applyTerminalDisclaimer(afterPTE, record);
  const afterTerminalDisclaimer = tdResult.date;

  // Step 5: Apply maintenance fee lapse
  const feeResult = applyMaintenanceFeeLapse(afterTerminalDisclaimer, record);
  const finalDate = feeResult.date;

  // Assess confidence
  const { confidence, reasons } = assessConfidence(record);

  const breakdown: ExpirationBreakdown = {
    baseExpirationDate,
    afterPTA,
    afterPTE,
    afterTerminalDisclaimer,
    finalDate,
    ptaDaysAdded: ptaResult.daysAdded,
    pteDaysAdded: pteResult.daysAdded,
    terminalDisclaimerApplied: tdResult.applied,
    lapsedEarlyDueToFees: feeResult.lapsed,
    lapseWindow: feeResult.lapseWindow,
  };

  return {
    patentId: record.patentId,
    patentType: record.patentType,
    expirationDate: finalDate,
    breakdown,
    confidence,
    confidenceReasons: reasons,
  };
}
