import { fetchWithRetry } from "../fetcher";
import { writeRawRecord } from "../storage";
import { ensureUSPrefix } from "../util";
import type { PatentRecord, MaintenanceFeeStatus, FeeWindow } from "../types/index";
import type { RawMaintenanceFeeRecord } from "../types/raw";

const DEFAULT_BASE_URL = "https://developer.uspto.gov/api/maintenance-fees";

function getBaseUrl(): string {
  return process.env.USPTO_MAINTENANCE_FEE_API_URL ?? DEFAULT_BASE_URL;
}

/**
 * Fetch maintenance fee data for a single patent.
 */
export async function fetchMaintenanceFee(
  patentNumber: string,
  signal?: AbortSignal
): Promise<RawMaintenanceFeeRecord> {
  const url = `${getBaseUrl()}/${patentNumber}`;
  const record = await fetchWithRetry<RawMaintenanceFeeRecord>(url, { signal });
  await writeRawRecord("maintenance-fees", patentNumber, record);
  return record;
}

/**
 * Transform a RawMaintenanceFeeRecord into Partial<PatentRecord>.
 * Only maps fields that the maintenance fee API provides.
 */
export function transformMaintenanceFee(
  raw: RawMaintenanceFeeRecord
): Partial<PatentRecord> {
  const feeWindows: FeeWindow[] = raw.fee_events.map((event) => ({
    feeCode: event.fee_code,
    dueDate: event.due_date,
    paidDate: event.paid_date ?? undefined,
    status: mapFeeStatus(event.status),
  }));

  const maintenanceFeeStatus: MaintenanceFeeStatus = {
    feeWindows,
    smallEntityStatus: raw.small_entity,
    expired: raw.expired,
  };

  return {
    patentId: ensureUSPrefix(raw.patent_number),
    maintenanceFeeStatus,
  };
}

function mapFeeStatus(raw: string): "paid" | "unpaid" | "overdue" {
  const normalized = raw.toLowerCase();
  if (normalized === "paid") return "paid";
  if (normalized === "overdue") return "overdue";
  return "unpaid";
}
