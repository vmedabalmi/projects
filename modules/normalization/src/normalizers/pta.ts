import type { NormalizedPTA, ValidationError } from "../types/index";

interface PTAResult {
  value: NormalizedPTA | undefined;
  warnings: ValidationError[];
}

function toNonNegativeInt(
  field: string,
  val: unknown,
  warnings: ValidationError[]
): number {
  if (val === undefined || val === null) {
    warnings.push({
      field,
      message: `PTA field "${field}" is missing, defaulting to 0`,
      rawValue: val,
    });
    return 0;
  }

  const num = Number(val);
  if (!Number.isInteger(num) || num < 0) {
    warnings.push({
      field,
      message: `PTA field "${field}" must be a non-negative integer, got ${val}, defaulting to 0`,
      rawValue: val,
    });
    return 0;
  }

  return num;
}

/**
 * Normalize PTA data. Accepts either a ptaDays number (from ingestion) or
 * a pta object with component fields.
 */
export function normalizePTA(
  ptaDays: number | undefined,
  ptaObj: Record<string, unknown> | undefined
): PTAResult {
  const warnings: ValidationError[] = [];

  // If we have neither, PTA is absent
  if (ptaDays === undefined && !ptaObj) {
    return { value: undefined, warnings };
  }

  let totalPTADays: number;
  let aDelay = 0;
  let bDelay = 0;
  let cDelay = 0;
  let overlap = 0;

  if (ptaObj) {
    aDelay = toNonNegativeInt("pta.aDelay", ptaObj.aDelay, warnings);
    bDelay = toNonNegativeInt("pta.bDelay", ptaObj.bDelay, warnings);
    cDelay = toNonNegativeInt("pta.cDelay", ptaObj.cDelay, warnings);
    overlap = toNonNegativeInt("pta.overlap", ptaObj.overlap, warnings);

    const objTotal = ptaObj.totalPTADays;
    if (objTotal !== undefined && Number.isInteger(Number(objTotal)) && Number(objTotal) >= 0) {
      totalPTADays = Number(objTotal);
    } else {
      totalPTADays = ptaDays ?? Math.max(0, aDelay + bDelay + cDelay - overlap);
    }
  } else {
    // Only ptaDays from ingestion
    totalPTADays = toNonNegativeInt("pta.totalPTADays", ptaDays, warnings);
  }

  return {
    value: {
      totalPTADays,
      aDelay,
      bDelay,
      cDelay,
      overlap,
    },
    warnings,
  };
}
