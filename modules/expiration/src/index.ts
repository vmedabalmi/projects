// Public API for @patentproject/expiration

export {
  PatentType,
  MaintenanceFeeWindow,
  ExpirationConfidence,
} from "./types/index";

export type {
  PatentRecord,
  PTARecord,
  PTERecord,
  TerminalDisclaimer,
  MaintenanceFeeRecord,
  ExpirationBreakdown,
  ExpirationResult,
} from "./types/index";

export { calculateExpiration } from "./expirationCalculator";
export { assessConfidence } from "./confidence";

export { calculateUtilityExpiration } from "./calculators/utilityExpiration";
export { calculateDesignExpiration } from "./calculators/designExpiration";
export { calculatePlantExpiration } from "./calculators/plantExpiration";

export { applyPTA } from "./modifiers/pta";
export { applyPTE } from "./modifiers/pte";
export { applyTerminalDisclaimer } from "./modifiers/terminalDisclaimer";
export { applyMaintenanceFeeLapse } from "./modifiers/maintenanceFee";

export { addDays, addYears, minDate, maxDate } from "./utils/dates";
