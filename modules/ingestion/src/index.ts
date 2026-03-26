// Public API for @patentproject/ingestion

export type {
  PatentRecord,
  MaintenanceFeeStatus,
  FeeWindow,
  SourceName,
} from "./types/index";

export type {
  RawPatentsViewRecord,
  RawPatentsViewResponse,
  RawMaintenanceFeeRecord,
  RawPatentCenterRecord,
} from "./types/raw";

export {
  fetchPatentsViewBatches,
  fetchPatentsViewById,
  fetchPatentsViewPage,
  transformPatentsView,
} from "./sources/patentsview";

export {
  fetchMaintenanceFee,
  transformMaintenanceFee,
} from "./sources/maintenanceFees";

export {
  fetchPatentCenter,
  transformPatentCenter,
} from "./sources/patentCenter";

export { mergePartials, mergeAndStore } from "./merger";

export {
  writeRawRecord,
  readRawRecord,
  writeMergedRecord,
  readMergedRecord,
} from "./storage";

import pino from "pino";
import { fetchPatentsViewById, transformPatentsView } from "./sources/patentsview";
import { fetchMaintenanceFee, transformMaintenanceFee } from "./sources/maintenanceFees";
import { fetchPatentCenter, transformPatentCenter } from "./sources/patentCenter";
import { mergeAndStore } from "./merger";
import type { PatentRecord } from "./types/index";

const logger = pino({ name: "ingestion" });

/**
 * High-level convenience: fetch all available data for a single patent
 * from all three sources and return a merged Partial<PatentRecord>.
 *
 * Failures from individual sources are caught and logged — the merged
 * result will simply lack those fields.
 */
export async function fetchPatentById(
  patentId: string,
  options?: { applicationNumber?: string; signal?: AbortSignal }
): Promise<Partial<PatentRecord>> {
  const partials: Partial<PatentRecord>[] = [];

  // Strip "US" prefix for API calls that expect bare numbers
  const bareNumber = patentId.replace(/^US/i, "");

  // Source 1: PatentsView
  try {
    const raw = await fetchPatentsViewById(bareNumber, options?.signal);
    if (raw) {
      partials.push(transformPatentsView(raw));
    }
  } catch (err) {
    logger.error(
      { patentId, source: "patentsview", error: (err as Error).message },
      "PatentsView fetch failed"
    );
  }

  // Source 2: Maintenance Fees
  try {
    const raw = await fetchMaintenanceFee(bareNumber, options?.signal);
    partials.push(transformMaintenanceFee(raw));
  } catch (err) {
    logger.error(
      { patentId, source: "maintenance-fees", error: (err as Error).message },
      "Maintenance fee fetch failed"
    );
  }

  // Source 3: Patent Center (requires application number)
  if (options?.applicationNumber) {
    try {
      const raw = await fetchPatentCenter(
        options.applicationNumber,
        options?.signal
      );
      partials.push(transformPatentCenter(raw));
    } catch (err) {
      logger.error(
        { patentId, source: "patent-center", error: (err as Error).message },
        "Patent Center fetch failed"
      );
    }
  }

  return mergeAndStore(patentId, partials);
}
