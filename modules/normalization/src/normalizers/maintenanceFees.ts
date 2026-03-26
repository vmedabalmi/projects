import { MaintenanceFeeWindow } from "../types/index";
import type {
  IngestionMaintenanceFeeStatus,
  IngestionFeeWindow,
  NormalizedMaintenanceFees,
  NormalizedFeeWindow,
  ValidationError,
} from "../types/index";

interface MaintenanceFeeResult {
  value: NormalizedMaintenanceFees | undefined;
  warnings: ValidationError[];
}

const VALID_WINDOWS = new Set(Object.values(MaintenanceFeeWindow));

const FEE_CODE_WINDOW_MAP: Record<string, MaintenanceFeeWindow> = {
  m1551: MaintenanceFeeWindow.FIRST,
  m2551: MaintenanceFeeWindow.FIRST,
  m1552: MaintenanceFeeWindow.SECOND,
  m2552: MaintenanceFeeWindow.SECOND,
  m1553: MaintenanceFeeWindow.THIRD,
  m2553: MaintenanceFeeWindow.THIRD,
};

function inferWindow(
  feeCode: string | undefined,
  index: number
): MaintenanceFeeWindow | undefined {
  if (feeCode) {
    const mapped = FEE_CODE_WINDOW_MAP[feeCode.toLowerCase()];
    if (mapped) return mapped;
  }
  // Fall back to order-based inference
  const windows = [
    MaintenanceFeeWindow.FIRST,
    MaintenanceFeeWindow.SECOND,
    MaintenanceFeeWindow.THIRD,
  ];
  return windows[index];
}

function coerceBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    return val.toLowerCase() === "true";
  }
  return false;
}

function isValidDate(val: unknown): val is string {
  if (typeof val !== "string" || val === "") return false;
  return !isNaN(new Date(val).getTime());
}

function isValidWindow(val: unknown): val is MaintenanceFeeWindow {
  return typeof val === "string" && VALID_WINDOWS.has(val as MaintenanceFeeWindow);
}

export function normalizeMaintenanceFees(
  raw: IngestionMaintenanceFeeStatus | undefined
): MaintenanceFeeResult {
  const warnings: ValidationError[] = [];

  if (!raw) {
    return { value: undefined, warnings };
  }

  const normalizedWindows: NormalizedFeeWindow[] = [];
  const rawWindows = raw.feeWindows ?? [];

  for (let i = 0; i < rawWindows.length; i++) {
    const fw = rawWindows[i];
    const result = normalizeFeeWindow(fw, i, warnings);
    if (result) {
      normalizedWindows.push(result);
    }
  }

  return {
    value: {
      feeWindows: normalizedWindows,
      smallEntityStatus: coerceBool(raw.smallEntityStatus),
      expired: coerceBool(raw.expired),
    },
    warnings,
  };
}

function normalizeFeeWindow(
  fw: IngestionFeeWindow,
  index: number,
  warnings: ValidationError[]
): NormalizedFeeWindow | null {
  // Determine window
  let window: MaintenanceFeeWindow | undefined;
  if (fw.window && isValidWindow(fw.window)) {
    window = fw.window;
  } else {
    window = inferWindow(fw.feeCode, index);
    if (!window) {
      warnings.push({
        field: `maintenanceFees.feeWindows[${index}].window`,
        message: "Could not determine maintenance fee window, dropping record",
        rawValue: fw,
      });
      return null;
    }
  }

  // Determine deadline date
  const deadline = fw.deadline ?? fw.dueDate;
  if (!isValidDate(deadline)) {
    warnings.push({
      field: `maintenanceFees.feeWindows[${index}].deadline`,
      message: "Invalid or missing deadline date, dropping fee record",
      rawValue: { deadline, dueDate: fw.dueDate },
    });
    return null;
  }

  // Determine grace end — default to 6 months after deadline
  let graceEnd = fw.graceEnd;
  if (!isValidDate(graceEnd)) {
    const deadlineDate = new Date(deadline);
    deadlineDate.setMonth(deadlineDate.getMonth() + 6);
    graceEnd = deadlineDate.toISOString().split("T")[0];
  }

  // Determine paid status
  const paid = fw.paid !== undefined ? coerceBool(fw.paid) : fw.status === "paid";

  const paidDate = isValidDate(fw.paidDate) ? fw.paidDate : undefined;

  return {
    window,
    feeCode: fw.feeCode ?? "",
    deadline: new Date(deadline).toISOString().split("T")[0],
    graceEnd: new Date(graceEnd).toISOString().split("T")[0],
    paid,
    paidDate,
  };
}
