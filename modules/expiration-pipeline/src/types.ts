import type { ExpirationResult, ExpirationBreakdown } from "@patentproject/expiration";

export type { ExpirationResult, ExpirationBreakdown };

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
