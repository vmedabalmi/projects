export type {
  ExpirationPipelineResult,
  UrgencyLabel,
  LookaheadWindow,
  Editorial,
  PatentRecord,
  ExpirationResult,
  ExpirationFactor,
} from "./types";

export { calculateDaysUntilExpiration, determineUrgencyLabel, buildEditorial } from "./enricher";
export { getLookaheadDays, buildLookaheadWindows } from "./lookahead";
export { listNormalizedPatentIds, readNormalizedRecord, writeExpirationResult } from "./storage";

import pino from "pino";
import { calculateExpiration } from "@patentproject/expiration";
import type { PatentRecord } from "@patentproject/expiration";
import { buildEditorial } from "./enricher";
import { buildLookaheadWindows } from "./lookahead";
import {
  listNormalizedPatentIds,
  readNormalizedRecord,
  writeExpirationResult,
} from "./storage";
import type { ExpirationPipelineResult } from "./types";

const logger = pino({ name: "expiration-pipeline" });

/**
 * Process a record directly (no I/O). Useful for testing.
 */
export function expireRecord(
  record: PatentRecord,
  now?: Date
): ExpirationPipelineResult {
  const expirationResult = calculateExpiration(record);
  const { editorial, daysUntilExpiration } = buildEditorial(expirationResult, now);
  const lookahead = buildLookaheadWindows(daysUntilExpiration, now);

  return {
    patentId: expirationResult.patentId,
    expirationDate: expirationResult.expirationDate,
    baseExpirationDate: expirationResult.baseExpirationDate,
    adjustedDays: expirationResult.adjustedDays,
    daysUntilExpiration,
    confidence: expirationResult.confidence,
    factors: expirationResult.factors,
    editorial,
    lookahead,
  };
}

/**
 * Process a single patent by ID. Reads from normalization output,
 * calculates expiration, enriches, and writes result.
 */
export async function expire(
  patentId: string
): Promise<ExpirationPipelineResult> {
  const record = await readNormalizedRecord(patentId);

  if (!record) {
    const errorResult: ExpirationPipelineResult = {
      patentId,
      expirationDate: "",
      baseExpirationDate: "",
      adjustedDays: 0,
      daysUntilExpiration: 0,
      confidence: "INDETERMINATE",
      factors: [],
      editorial: {
        urgencyLabel: "INDETERMINATE",
        summary: `No normalized record found for patent "${patentId}"`,
      },
      lookahead: [],
    };

    logger.error({ patentId }, "No normalized record found");
    await writeExpirationResult(patentId, errorResult);
    return errorResult;
  }

  const result = expireRecord(record);

  logger.info({
    patentId: result.patentId,
    urgencyLabel: result.editorial.urgencyLabel,
    daysUntilExpiration: result.daysUntilExpiration,
    confidence: result.confidence,
  }, "Patent processed");

  await writeExpirationResult(patentId, result);
  return result;
}

/**
 * Process all patents in the normalization output directory.
 */
export async function expireAll(): Promise<ExpirationPipelineResult[]> {
  const ids = await listNormalizedPatentIds();
  logger.info({ count: ids.length }, "Starting batch expiration pipeline");

  const results: ExpirationPipelineResult[] = [];

  for (const id of ids) {
    try {
      const result = await expire(id);
      results.push(result);
    } catch (err) {
      logger.error(
        { patentId: id, error: (err as Error).message },
        "Failed to process patent"
      );
      results.push({
        patentId: id,
        expirationDate: "",
        baseExpirationDate: "",
        adjustedDays: 0,
        daysUntilExpiration: 0,
        confidence: "INDETERMINATE",
        factors: [],
        editorial: {
          urgencyLabel: "INDETERMINATE",
          summary: `Error processing patent "${id}": ${(err as Error).message}`,
        },
        lookahead: [],
      });
    }
  }

  const summary = {
    total: results.length,
    expired: results.filter((r) => r.editorial.urgencyLabel === "EXPIRED").length,
    critical: results.filter((r) => r.editorial.urgencyLabel === "CRITICAL").length,
    warning: results.filter((r) => r.editorial.urgencyLabel === "WARNING").length,
    active: results.filter((r) => r.editorial.urgencyLabel === "ACTIVE").length,
  };
  logger.info(summary, "Batch expiration pipeline complete");

  return results;
}
