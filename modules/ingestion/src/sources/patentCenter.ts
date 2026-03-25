import { fetchWithRetry } from "../fetcher";
import { writeRawRecord } from "../storage";
import type { PatentRecord } from "../types/index";
import type { RawPatentCenterRecord } from "../types/raw";

const DEFAULT_BASE_URL =
  "https://developer.uspto.gov/api/patent-center";

function getBaseUrl(): string {
  return process.env.USPTO_PATENT_CENTER_API_URL ?? DEFAULT_BASE_URL;
}

/**
 * Fetch PTA (Patent Term Adjustment) data from Patent Center ODP.
 */
export async function fetchPatentCenter(
  applicationNumber: string,
  signal?: AbortSignal
): Promise<RawPatentCenterRecord> {
  const url = `${getBaseUrl()}/patents/applications/${applicationNumber}/continuity`;
  const record = await fetchWithRetry<RawPatentCenterRecord>(url, { signal });

  const patentId = record.patent_number ?? applicationNumber;
  await writeRawRecord("patent-center", patentId, record);
  return record;
}

/**
 * Transform a RawPatentCenterRecord into Partial<PatentRecord>.
 * Only maps fields that Patent Center provides (PTA days).
 */
export function transformPatentCenter(
  raw: RawPatentCenterRecord
): Partial<PatentRecord> {
  return {
    patentId: raw.patent_number,
    ptaDays: raw.pta_days,
  };
}
