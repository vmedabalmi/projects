export enum PatentType {
  UTILITY = "UTILITY",
  DESIGN = "DESIGN",
  PLANT = "PLANT",
}

export enum MaintenanceFeeWindow {
  YEAR_3_5 = "3.5yr",
  YEAR_7_5 = "7.5yr",
  YEAR_11_5 = "11.5yr",
}

export enum ExpirationConfidence {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INDETERMINATE = "INDETERMINATE",
}

export interface MaintenanceFeeRecord {
  window: MaintenanceFeeWindow;
  deadline: Date;
  graceEnd: Date;
  paid: boolean;
  paymentDate?: Date;
  revived: boolean;
}

export interface PTARecord {
  aDelayDays: number;
  bDelayDays: number;
  cDelayDays: number;
  applicantDelayDays: number;
  overlapDays: number;
  totalPTADays: number;
}

export interface PTERecord {
  granted: boolean;
  pendingApplication: boolean;
  extensionDays: number;
  fdaApprovalDate?: Date;
  fdaApplicationDate?: Date;
}

export interface TerminalDisclaimer {
  filedDate: Date;
  limitingPatentId: string;
  limitingDate: Date;
}

export interface PatentRecord {
  patentId: string;
  patentType: PatentType;
  filingDate: Date;
  grantDate: Date;
  isInternational: boolean;
  pta?: PTARecord;
  pte?: PTERecord;
  terminalDisclaimer?: TerminalDisclaimer;
  maintenanceFees?: MaintenanceFeeRecord[];
}

export interface ExpirationBreakdown {
  baseExpirationDate: Date;
  afterPTA: Date;
  afterPTE: Date;
  afterTerminalDisclaimer: Date;
  finalDate: Date;
  ptaDaysAdded: number;
  pteDaysAdded: number;
  terminalDisclaimerApplied: boolean;
  lapsedEarlyDueToFees: boolean;
  lapseWindow?: MaintenanceFeeWindow;
}

export interface ExpirationResult {
  patentId: string;
  patentType: PatentType;
  expirationDate: Date;
  breakdown: ExpirationBreakdown;
  confidence: ExpirationConfidence;
  confidenceReasons: string[];
}
