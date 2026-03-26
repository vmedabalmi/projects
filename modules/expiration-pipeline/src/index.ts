export type {
  ExpirationPipelineResult,
  UrgencyLabel,
  LookaheadWindow,
  Editorial,
  ExpirationFactor,
} from "./types";

export { calculateDaysUntilExpiration, determineUrgencyLabel, buildEditorial } from "./enricher";
export { getLookaheadDays, buildLookaheadWindows } from "./lookahead";
export { listNormalizedPatentIds, readNormalizedRecord, writeExpirationResult } from "./storage";

import pino from "pino";
import { calculateExpiration } from "@patentproject/expiration";
import type { ExpirationResult, PatentRecord } from "@patentproject/expiration";
import { buildEditorial } from "./enricher";
import { buildLookaheadWindows } from "./lookahead";
import {
  listNormalizedPatentIds,
  readNormalizedRecord,
  writeExpirationResult,
} from "./storage";
import type { ExpirationPipelineResult, ExpirationFactor } from "./types";

const logger = pino({ name: "expiration-pipeline" });

function dateToString(date: Date | string): string {
  if (typeof date === "string") return date;
  return date.toISOString().split("T")[0];
}

/**
 * Convert the new ExpirationResult breakdown into pipeline factors.
 */
function extractFactors(result: ExpirationResult): ExpirationFactor[] {
  const factors: ExpirationFactor[] = [];
  const bd = result.breakdown;

  if (bd.ptaDaysAdded > 0) {
    factors.push({
      type: "PTA",
      description: `Patent Term Adjustment: +${bd.ptaDaysAdded} days`,
      daysAdjusted: bd.ptaDaysAdded,
    });
  }

  if (bd.pteDaysAdded > 0) {
    factors.push({
      type: "PTE",
      description: `Patent Term Extension: +${bd.pteDaysAdded} days`,
      daysAdjusted: bd.pteDaysAdded,
    });
  }

  if (bd.terminalDisclaimerApplied) {
    factors.push({
      type: "TERMINAL_DISCLAIMER",
      description: "Terminal disclaimer filed — expiration capped by related patent",
      daysAdjusted: 0,
    });
  }

  if (bd.lapsedEarlyDueToFees) {
    factors.push({
      type: "MAINTENANCE_FEE_LAPSE",
      description: `Maintenance fee lapse at ${bd.lapseWindow ?? "unknown"} window`,
      daysAdjusted: 0,
    });
  }

  return factors;
}

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
  const factors = extractFactors(expirationResult);

  const totalAdjusted = expirationResult.breakdown.ptaDaysAdded + expirationResult.breakdown.pteDaysAdded;

  return {
    patentId: expirationResult.patentId,
    expirationDate: dateToString(expirationResult.expirationDate),
    baseExpirationDate: dateToString(expirationResult.breakdown.baseExpirationDate),
    adjustedDays: totalAdjusted,
    daysUntilExpiration,
    confidence: expirationResult.confidence,
    factors,
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
