// Public API for @patentproject/normalization

export type {
  IngestionPatentRecord,
  NormalizationResult,
  NormalizedPatentRecord,
  NormalizedFeeWindow,
  NormalizedMaintenanceFees,
  NormalizedPTA,
  NormalizedPTE,
  ValidationError,
} from "./types/index";

export {
  PatentType,
  MaintenanceFeeWindow,
} from "./types/index";

export { normalizeRecord } from "./normalizer";
export { normalizeDate } from "./normalizers/dates";
export { normalizePatentType } from "./normalizers/patentType";
export { normalizeMaintenanceFees } from "./normalizers/maintenanceFees";
export { normalizePTA } from "./normalizers/pta";
export { normalizePTE } from "./normalizers/pte";

export {
  listMergedPatentIds,
  readMergedRecord,
  writeNormalizedRecord,
  readNormalizedRecord,
} from "./storage";

import pino from "pino";
import { normalizeRecord } from "./normalizer";
import { listMergedPatentIds, readMergedRecord, writeNormalizedRecord } from "./storage";
import type { NormalizationResult } from "./types/index";

const logger = pino({ name: "normalization" });

/**
 * Normalize a single patent by ID.
 * Reads from ingestion merged output, normalizes, and writes if successful.
 */
export async function normalize(patentId: string): Promise<NormalizationResult> {
  const input = await readMergedRecord(patentId);

  if (!input) {
    return {
      patentId,
      success: false,
      errors: [{
        field: "patentId",
        message: `No merged record found for patent "${patentId}"`,
        rawValue: patentId,
      }],
      warnings: [],
    };
  }

  const result = normalizeRecord(input);

  if (result.success && result.record) {
    await writeNormalizedRecord(patentId, result.record);
  }

  return result;
}

/**
 * Batch normalize all patents in the ingestion merged directory.
 */
export async function normalizeAll(): Promise<NormalizationResult[]> {
  const ids = await listMergedPatentIds();
  logger.info({ count: ids.length }, "Starting batch normalization");

  const results: NormalizationResult[] = [];

  for (const id of ids) {
    const result = await normalize(id);
    results.push(result);
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  logger.info({ total: results.length, succeeded, failed }, "Batch normalization complete");

  return results;
}
