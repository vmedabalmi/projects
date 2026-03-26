/**
 * Input type — matches the Partial<PatentRecord> shape from ingestion module.
 * We re-declare it here to avoid a hard dependency on the ingestion package.
 */
export interface IngestionPatentRecord {
  patentId?: string;
  patentType?: string;
  patentDate?: string;
  applicationDate?: string;
  title?: string;
  assignees?: string[];
  inventors?: string[];
  cpcCodes?: string[];
  maintenanceFeeStatus?: IngestionMaintenanceFeeStatus;
  ptaDays?: number;
  expirationDate?: string;
  // Fields that may appear from extended sources
  isInternational?: boolean;
  terminalDisclaimer?: boolean;
  pte?: Record<string, unknown>;
  pta?: Record<string, unknown>;
}

export interface IngestionMaintenanceFeeStatus {
  feeWindows?: IngestionFeeWindow[];
  smallEntityStatus?: boolean;
  expired?: boolean;
}

export interface IngestionFeeWindow {
  feeCode?: string;
  dueDate?: string;
  paidDate?: string;
  status?: string;
  window?: string;
  deadline?: string;
  graceEnd?: string;
  paid?: boolean | string;
}

// --- Normalized output types ---

export enum PatentType {
  UTILITY = "UTILITY",
  DESIGN = "DESIGN",
  PLANT = "PLANT",
}

export enum MaintenanceFeeWindow {
  FIRST = "FIRST",    // 3.5 years
  SECOND = "SECOND",  // 7.5 years
  THIRD = "THIRD",    // 11.5 years
}

export interface NormalizedFeeWindow {
  window: MaintenanceFeeWindow;
  feeCode: string;
  deadline: string;
  graceEnd: string;
  paid: boolean;
  paidDate?: string;
}

export interface NormalizedMaintenanceFees {
  feeWindows: NormalizedFeeWindow[];
  smallEntityStatus: boolean;
  expired: boolean;
}

export interface NormalizedPTA {
  totalPTADays: number;
  aDelay: number;
  bDelay: number;
  cDelay: number;
  overlap: number;
}

export interface NormalizedPTE {
  extensionDays: number;
  granted: boolean;
  pendingApplication: boolean;
}

export interface NormalizedPatentRecord {
  patentId: string;
  patentType: PatentType;
  filingDate: string;
  grantDate: string;
  title: string;
  assignees: string[];
  inventors: string[];
  cpcCodes: string[];
  maintenanceFees?: NormalizedMaintenanceFees;
  pta?: NormalizedPTA;
  pte?: NormalizedPTE;
  terminalDisclaimer?: boolean;
  isInternational: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  rawValue: unknown;
}

export interface NormalizationResult {
  patentId: string;
  success: boolean;
  record?: NormalizedPatentRecord;
  errors: ValidationError[];
  warnings: ValidationError[];
}
