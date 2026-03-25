import pino from "pino";
import { writeMergedRecord } from "./storage";
import type { PatentRecord } from "./types/index";

const logger = pino({ name: "ingestion-merger" });

/**
 * Merge multiple Partial<PatentRecord> from different sources into one.
 * Later entries override earlier ones for the same field.
 * Missing data is left undefined — never throws on gaps.
 */
export function mergePartials(
  partials: Partial<PatentRecord>[]
): Partial<PatentRecord> {
  const merged: Partial<PatentRecord> = {};

  for (const partial of partials) {
    for (const key of Object.keys(partial) as (keyof PatentRecord)[]) {
      const value = partial[key];
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }

  return merged;
}

/**
 * Merge partials and write the result to storage.
 */
export async function mergeAndStore(
  patentId: string,
  partials: Partial<PatentRecord>[]
): Promise<Partial<PatentRecord>> {
  logger.info(
    { patentId, sourceCount: partials.length },
    "Merging patent records"
  );

  const merged = mergePartials(partials);
  await writeMergedRecord(patentId, merged);

  logger.info({ patentId }, "Merged record written to storage");
  return merged;
}
