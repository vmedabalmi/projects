import type {
  IngestionPatentRecord,
  ValidationError,
} from "../types/index";

/**
 * Field-level validation for required and optional fields.
 * Returns errors for required missing fields, warnings for optional issues.
 */
export function validateRequiredFields(
  input: IngestionPatentRecord
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // patentId — required
  if (!input.patentId || typeof input.patentId !== "string" || input.patentId.trim() === "") {
    errors.push({
      field: "patentId",
      message: "patentId is required and must be a non-empty string",
      rawValue: input.patentId,
    });
  }

  // patentType — required (will be coerced by normalizer, but must exist)
  if (input.patentType === undefined || input.patentType === null) {
    warnings.push({
      field: "patentType",
      message: "patentType is missing; will default to UTILITY",
      rawValue: input.patentType,
    });
  }

  // filingDate (applicationDate in ingestion) — required
  if (!input.applicationDate) {
    errors.push({
      field: "filingDate",
      message: "filingDate (applicationDate) is required",
      rawValue: input.applicationDate,
    });
  }

  // grantDate (patentDate in ingestion) — required
  if (!input.patentDate) {
    errors.push({
      field: "grantDate",
      message: "grantDate (patentDate) is required",
      rawValue: input.patentDate,
    });
  }

  // Optional field warnings
  if (!input.title) {
    warnings.push({
      field: "title",
      message: "title is missing, will default to empty string",
      rawValue: input.title,
    });
  }

  if (!input.assignees || input.assignees.length === 0) {
    warnings.push({
      field: "assignees",
      message: "assignees list is empty",
      rawValue: input.assignees,
    });
  }

  if (!input.inventors || input.inventors.length === 0) {
    warnings.push({
      field: "inventors",
      message: "inventors list is empty",
      rawValue: input.inventors,
    });
  }

  return { errors, warnings };
}
