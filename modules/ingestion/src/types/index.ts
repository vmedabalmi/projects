/**
 * PatentRecord — the canonical shape that downstream modules (expiration, etc.)
 * consume. Ingestion produces Partial<PatentRecord> since not every source
 * provides every field.
 */
export interface PatentRecord {
  patentId: string;
  patentType: string;
  patentDate: string;
  applicationDate: string;
  title: string;
  assignees: string[];
  inventors: string[];
  cpcCodes: string[];
  maintenanceFeeStatus: MaintenanceFeeStatus;
  ptaDays: number;
  expirationDate: string | undefined;
}

export interface MaintenanceFeeStatus {
  feeWindows: FeeWindow[];
  smallEntityStatus: boolean;
  expired: boolean;
}

export interface FeeWindow {
  feeCode: string;
  dueDate: string;
  paidDate: string | undefined;
  status: "paid" | "unpaid" | "overdue";
}

export type SourceName = "patentsview" | "maintenance-fees" | "patent-center";
