import { normalizeMaintenanceFees } from "../src/normalizers/maintenanceFees";
import { MaintenanceFeeWindow } from "../src/types/index";
import type { IngestionMaintenanceFeeStatus } from "../src/types/index";

describe("normalizeMaintenanceFees", () => {
  test("returns undefined for missing input", () => {
    const result = normalizeMaintenanceFees(undefined);
    expect(result.value).toBeUndefined();
    expect(result.warnings).toHaveLength(0);
  });

  test("normalizes valid fee window from ingestion format", () => {
    const input: IngestionMaintenanceFeeStatus = {
      feeWindows: [
        {
          feeCode: "M1551",
          dueDate: "2022-06-19",
          paidDate: "2022-05-01",
          status: "paid",
        },
      ],
      smallEntityStatus: false,
      expired: false,
    };

    const result = normalizeMaintenanceFees(input);
    expect(result.value).toBeDefined();
    expect(result.value?.feeWindows).toHaveLength(1);
    expect(result.value?.feeWindows[0].window).toBe(MaintenanceFeeWindow.FIRST);
    expect(result.value?.feeWindows[0].paid).toBe(true);
    expect(result.value?.feeWindows[0].feeCode).toBe("M1551");
    expect(result.value?.expired).toBe(false);
  });

  test("infers fee window from fee code", () => {
    const input: IngestionMaintenanceFeeStatus = {
      feeWindows: [
        { feeCode: "M1552", dueDate: "2026-06-19", status: "unpaid" },
      ],
      smallEntityStatus: false,
      expired: false,
    };

    const result = normalizeMaintenanceFees(input);
    expect(result.value?.feeWindows[0].window).toBe(MaintenanceFeeWindow.SECOND);
    expect(result.value?.feeWindows[0].paid).toBe(false);
  });

  test("drops fee record with invalid deadline and adds warning", () => {
    const input: IngestionMaintenanceFeeStatus = {
      feeWindows: [
        { feeCode: "M1551", dueDate: "not-a-date", status: "paid" },
      ],
      smallEntityStatus: false,
      expired: false,
    };

    const result = normalizeMaintenanceFees(input);
    expect(result.value?.feeWindows).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].field).toContain("deadline");
  });

  test("coerces boolean from string", () => {
    const input: IngestionMaintenanceFeeStatus = {
      feeWindows: [
        {
          feeCode: "M1551",
          dueDate: "2022-06-19",
          paid: "true" as unknown as boolean,
          status: "paid",
        },
      ],
      smallEntityStatus: false,
      expired: false,
    };

    const result = normalizeMaintenanceFees(input);
    expect(result.value?.feeWindows[0].paid).toBe(true);
  });
});
