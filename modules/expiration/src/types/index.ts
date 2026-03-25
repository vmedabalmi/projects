export enum PatentType {
  UTILITY = "UTILITY",
  DESIGN = "DESIGN",
  PLANT = "PLANT",
}

export enum Confidence {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  INDETERMINATE = "INDETERMINATE",
}

export interface PatentRecord {
  patentId: string;
  patentType: PatentType | string;
  filingDate: string;
  grantDate: string;
  title: string;
  assignees: string[];
  inventors: string[];
  cpcCodes: string[];
  maintenanceFees?: {
    feeWindows: {
      window: string;
      feeCode: string;
      deadline: string;
      graceEnd: string;
      paid: boolean;
      paidDate?: string;
    }[];
    smallEntityStatus: boolean;
    expired: boolean;
  };
  pta?: {
    totalPTADays: number;
    aDelay: number;
    bDelay: number;
    cDelay: number;
    overlap: number;
  };
  pte?: {
    extensionDays: number;
    granted: boolean;
    pendingApplication: boolean;
  };
  terminalDisclaimer?: boolean;
  isInternational: boolean;
}

export interface ExpirationResult {
  patentId: string;
  expirationDate: string;
  baseExpirationDate: string;
  adjustedDays: number;
  confidence: Confidence;
  factors: ExpirationFactor[];
}

export interface ExpirationFactor {
  type: string;
  description: string;
  daysAdjusted: number;
}
