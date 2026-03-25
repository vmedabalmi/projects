export type UrgencyLabel =
  | "EXPIRED"
  | "CRITICAL"
  | "WARNING"
  | "UPCOMING"
  | "ACTIVE"
  | "INDETERMINATE";

export interface LookaheadWindow {
  days: number;
  date: string;
  isPastExpiration: boolean;
}

export interface Editorial {
  urgencyLabel: UrgencyLabel;
  summary: string;
}

export interface ExpirationFactor {
  type: string;
  description: string;
  daysAdjusted: number;
}

export interface ExpirationPipelineResult {
  patentId: string;
  expirationDate: string;
  baseExpirationDate: string;
  adjustedDays: number;
  daysUntilExpiration: number;
  confidence: string;
  factors: ExpirationFactor[];
  editorial: Editorial;
  lookahead: LookaheadWindow[];
}

export type PatentType = "UTILITY" | "DESIGN" | "PLANT";

export interface PatentDisplayRecord extends ExpirationPipelineResult {
  title: string;
  patentType: PatentType;
  filingDate: string;
  grantDate: string;
  assignees: string[];
  inventors: string[];
  cpcCodes: string[];
  ptaDays: number;
  pteDays: number;
  terminalDisclaimer: boolean;
  maintenanceFeeExpired: boolean;
}
