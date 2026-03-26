import type { NormalizedPTE, ValidationError } from "../types/index";

interface PTEResult {
  value: NormalizedPTE | undefined;
  warnings: ValidationError[];
}

const MAX_EXTENSION_DAYS = 1825; // 5 year cap

function coerceBool(field: string, val: unknown, warnings: ValidationError[]): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true;
    if (val.toLowerCase() === "false") return false;
  }
  if (val !== undefined && val !== null) {
    warnings.push({
      field,
      message: `PTE field "${field}" should be boolean, got ${typeof val}: ${val}`,
      rawValue: val,
    });
  }
  return false;
}

/**
 * Normalize PTE (Patent Term Extension) data.
 */
export function normalizePTE(
  raw: Record<string, unknown> | undefined
): PTEResult {
  const warnings: ValidationError[] = [];

  if (!raw) {
    return { value: undefined, warnings };
  }

  let extensionDays = Number(raw.extensionDays ?? 0);
  if (!Number.isInteger(extensionDays) || extensionDays < 0) {
    warnings.push({
      field: "pte.extensionDays",
      message: `PTE extensionDays must be a non-negative integer, got ${raw.extensionDays}, defaulting to 0`,
      rawValue: raw.extensionDays,
    });
    extensionDays = 0;
  }

  if (extensionDays > MAX_EXTENSION_DAYS) {
    warnings.push({
      field: "pte.extensionDays",
      message: `PTE extensionDays ${extensionDays} exceeds 5-year cap (${MAX_EXTENSION_DAYS}), clamping`,
      rawValue: raw.extensionDays,
    });
    extensionDays = MAX_EXTENSION_DAYS;
  }

  const granted = coerceBool("pte.granted", raw.granted, warnings);
  const pendingApplication = coerceBool(
    "pte.pendingApplication",
    raw.pendingApplication,
    warnings
  );

  if (granted && pendingApplication) {
    warnings.push({
      field: "pte",
      message: "PTE cannot be both granted and pending simultaneously; trusting granted=true, setting pendingApplication=false",
      rawValue: { granted: raw.granted, pendingApplication: raw.pendingApplication },
    });
    return {
      value: { extensionDays, granted: true, pendingApplication: false },
      warnings,
    };
  }

  return {
    value: { extensionDays, granted, pendingApplication },
    warnings,
  };
}
