import { fetchWithRetry } from "../fetcher";
import { writeRawRecord } from "../storage";
import { ensureUSPrefix } from "../util";
import type { PatentRecord } from "../types/index";
import type {
  RawPatentsViewRecord,
  RawPatentsViewResponse,
} from "../types/raw";

const DEFAULT_BASE_URL = "https://api.patentsview.org/patents";
const DEFAULT_PAGE_SIZE = 25;

function getBaseUrl(): string {
  return process.env.PATENTSVIEW_API_URL ?? DEFAULT_BASE_URL;
}

export interface PatentsViewFetchOptions {
  query: Record<string, unknown>;
  fields?: string[];
  pageSize?: number;
  signal?: AbortSignal;
}

/**
 * Fetch a single page of patents from PatentsView.
 */
export async function fetchPatentsViewPage(
  query: Record<string, unknown>,
  fields: string[],
  offset: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<RawPatentsViewResponse> {
  const params = new URLSearchParams({
    q: JSON.stringify(query),
    f: JSON.stringify(fields),
    o: JSON.stringify({ page: 1, per_page: pageSize }),
    s: JSON.stringify([{ patent_date: "desc" }]),
  });

  // PatentsView uses page-based; offset is represented by page number
  const page = Math.floor(offset / pageSize) + 1;
  params.set(
    "o",
    JSON.stringify({ page, per_page: pageSize })
  );

  const url = `${getBaseUrl()}/query?${params.toString()}`;
  return fetchWithRetry<RawPatentsViewResponse>(url, { signal });
}

/**
 * Paginated generator that yields batches of RawPatentsViewRecords.
 * Writes each raw record to storage immediately after fetch.
 */
export async function* fetchPatentsViewBatches(
  options: PatentsViewFetchOptions
): AsyncGenerator<RawPatentsViewRecord[]> {
  const fields = options.fields ?? [
    "patent_id",
    "patent_type",
    "patent_date",
    "app_date",
    "patent_title",
    "assignees",
    "inventors",
    "cpcs",
  ];
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const response = await fetchPatentsViewPage(
      options.query,
      fields,
      offset,
      pageSize,
      options.signal
    );

    total = response.total_patent_count;

    // Write each raw record to storage
    for (const record of response.patents) {
      await writeRawRecord("patentsview", record.patent_id, record);
    }

    yield response.patents;
    offset += pageSize;
  }
}

/**
 * Fetch a single patent by ID from PatentsView.
 */
export async function fetchPatentsViewById(
  patentId: string,
  signal?: AbortSignal
): Promise<RawPatentsViewRecord | null> {
  const query = { patent_id: patentId };
  const fields = [
    "patent_id",
    "patent_type",
    "patent_date",
    "app_date",
    "patent_title",
    "assignees",
    "inventors",
    "cpcs",
  ];

  const response = await fetchPatentsViewPage(query, fields, 0, 1, signal);

  if (response.patents.length === 0) {
    return null;
  }

  const record = response.patents[0];
  await writeRawRecord("patentsview", record.patent_id, record);
  return record;
}

/**
 * Transform a RawPatentsViewRecord into Partial<PatentRecord>.
 * Only maps fields that PatentsView provides.
 */
export function transformPatentsView(
  raw: RawPatentsViewRecord
): Partial<PatentRecord> {
  const assignees = raw.assignees.map((a) => {
    if (a.assignee_organization) {
      return a.assignee_organization;
    }
    return [a.assignee_first_name, a.assignee_last_name]
      .filter(Boolean)
      .join(" ");
  });

  const inventors = raw.inventors.map((i) =>
    [i.inventor_first_name, i.inventor_last_name].filter(Boolean).join(" ")
  );

  const cpcCodes = raw.cpcs.map((c) => c.cpc_subgroup_id);

  return {
    patentId: ensureUSPrefix(raw.patent_id),
    patentType: raw.patent_type,
    patentDate: raw.patent_date,
    applicationDate: raw.app_date,
    title: raw.patent_title,
    assignees,
    inventors,
    cpcCodes,
  };
}
