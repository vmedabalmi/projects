import { PatentType } from "../types/index";
import type { ValidationError } from "../types/index";

interface PatentTypeResult {
  value: PatentType;
  warning?: ValidationError;
}

const PATENT_TYPE_MAP: Record<string, PatentType> = {
  utility: PatentType.UTILITY,
  "1": PatentType.UTILITY,
  u: PatentType.UTILITY,
  design: PatentType.DESIGN,
  "2": PatentType.DESIGN,
  d: PatentType.DESIGN,
  plant: PatentType.PLANT,
  "3": PatentType.PLANT,
  p: PatentType.PLANT,
};

/**
 * Coerce a raw patent type string to PatentType enum.
 * Returns UTILITY with a warning for unrecognized values.
 */
export function normalizePatentType(rawValue: unknown): PatentTypeResult {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return {
      value: PatentType.UTILITY,
      warning: {
        field: "patentType",
        message: "Patent type is missing, defaulting to UTILITY",
        rawValue,
      },
    };
  }

  const normalized = String(rawValue).toLowerCase().trim();
  const mapped = PATENT_TYPE_MAP[normalized];

  if (mapped !== undefined) {
    return { value: mapped };
  }

  return {
    value: PatentType.UTILITY,
    warning: {
      field: "patentType",
      message: `Unrecognized patent type "${rawValue}", defaulting to UTILITY`,
      rawValue,
    },
  };
}
