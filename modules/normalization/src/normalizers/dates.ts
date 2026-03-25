import type { ValidationError } from "../types/index";

interface DateResult {
  value: string | undefined;
  error?: ValidationError;
}

/**
 * Parse and validate a date string. Returns ISO date string (YYYY-MM-DD)
 * or undefined with an error/warning.
 */
export function normalizeDate(
  field: string,
  rawValue: unknown,
  required: boolean
): DateResult {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    if (required) {
      return {
        value: undefined,
        error: {
          field,
          message: `Required date field "${field}" is missing`,
          rawValue,
        },
      };
    }
    return { value: undefined };
  }

  if (typeof rawValue !== "string") {
    return {
      value: undefined,
      error: {
        field,
        message: `Date field "${field}" must be a string, got ${typeof rawValue}`,
        rawValue,
      },
    };
  }

  const parsed = new Date(rawValue);
  if (isNaN(parsed.getTime())) {
    return {
      value: undefined,
      error: {
        field,
        message: `Date field "${field}" is not a valid date: "${rawValue}"`,
        rawValue,
      },
    };
  }

  // Return as ISO date string (YYYY-MM-DD)
  const isoDate = parsed.toISOString().split("T")[0];
  return { value: isoDate };
}
