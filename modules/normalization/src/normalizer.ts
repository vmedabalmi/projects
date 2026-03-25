import pino from "pino";
import { normalizeDate } from "./normalizers/dates";
import { normalizePatentType } from "./normalizers/patentType";
import { normalizeMaintenanceFees } from "./normalizers/maintenanceFees";
import { normalizePTA } from "./normalizers/pta";
import { normalizePTE } from "./normalizers/pte";
import { validateRequiredFields } from "./validators/patentRecord";
import type {
  IngestionPatentRecord,
  NormalizationResult,
  NormalizedPatentRecord,
  ValidationError,
} from "./types/index";

const logger = pino({ name: "normalization" });

/**
 * Main orchestrator: takes a Partial<PatentRecord> from ingestion
 * and returns a NormalizationResult.
 */
export function normalizeRecord(
  input: IngestionPatentRecord
): NormalizationResult {
  const patentId = input.patentId ?? "UNKNOWN";
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Step 1: Validate required fields exist
  const validation = validateRequiredFields(input);
  errors.push(...validation.errors);
  warnings.push(...validation.warnings);

  // If required fields are missing, fail early
  if (errors.length > 0) {
    logger.error({ patentId, errors }, "Normalization failed: missing required fields");
    return { patentId, success: false, errors, warnings };
  }

  // Step 2: Normalize dates
  const filingDateResult = normalizeDate("filingDate", input.applicationDate, true);
  const grantDateResult = normalizeDate("grantDate", input.patentDate, true);

  if (filingDateResult.error) errors.push(filingDateResult.error);
  if (grantDateResult.error) errors.push(grantDateResult.error);

  if (errors.length > 0) {
    logger.error({ patentId, errors }, "Normalization failed: invalid dates");
    return { patentId, success: false, errors, warnings };
  }

  // Step 3: Normalize patent type
  const patentTypeResult = normalizePatentType(input.patentType);
  if (patentTypeResult.warning) warnings.push(patentTypeResult.warning);

  // Step 4: Normalize maintenance fees
  const maintenanceResult = normalizeMaintenanceFees(input.maintenanceFeeStatus);
  warnings.push(...maintenanceResult.warnings);

  // Step 5: Normalize PTA
  const ptaResult = normalizePTA(
    input.ptaDays,
    input.pta as Record<string, unknown> | undefined
  );
  warnings.push(...ptaResult.warnings);

  // Step 6: Normalize PTE
  const pteResult = normalizePTE(
    input.pte as Record<string, unknown> | undefined
  );
  warnings.push(...pteResult.warnings);

  // Step 7: Build the normalized record
  const record: NormalizedPatentRecord = {
    patentId: input.patentId as string,
    patentType: patentTypeResult.value,
    filingDate: filingDateResult.value as string,
    grantDate: grantDateResult.value as string,
    title: input.title ?? "",
    assignees: input.assignees ?? [],
    inventors: input.inventors ?? [],
    cpcCodes: input.cpcCodes ?? [],
    maintenanceFees: maintenanceResult.value,
    pta: ptaResult.value,
    pte: pteResult.value,
    terminalDisclaimer: input.terminalDisclaimer,
    isInternational: input.isInternational ?? false,
  };

  if (warnings.length > 0) {
    logger.warn({ patentId, warningCount: warnings.length }, "Normalization succeeded with warnings");
  } else {
    logger.info({ patentId }, "Normalization succeeded");
  }

  return { patentId, success: true, record, errors, warnings };
}
