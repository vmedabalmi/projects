import {
  calculateDaysUntilExpiration,
  determineUrgencyLabel,
  generateSummary,
  buildEditorial,
} from "../src/enricher";
import type { ExpirationResult } from "@patentproject/expiration";
import { ExpirationConfidence, PatentType } from "@patentproject/expiration";

function d(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

describe("calculateDaysUntilExpiration", () => {
  test("returns positive days for future expiration", () => {
    const now = new Date("2026-01-01");
    const result = calculateDaysUntilExpiration("2026-04-01", now);
    expect(result).toBe(90);
  });

  test("returns negative days for past expiration", () => {
    const now = new Date("2026-04-01");
    const result = calculateDaysUntilExpiration("2026-01-01", now);
    expect(result).toBe(-90);
  });

  test("returns 0 for same-day expiration", () => {
    const now = new Date("2026-06-15");
    const result = calculateDaysUntilExpiration("2026-06-15", now);
    expect(result).toBe(0);
  });
});

describe("determineUrgencyLabel", () => {
  test("EXPIRED when days <= 0", () => {
    expect(determineUrgencyLabel(0, ExpirationConfidence.HIGH)).toBe("EXPIRED");
    expect(determineUrgencyLabel(-10, ExpirationConfidence.HIGH)).toBe("EXPIRED");
  });

  test("CRITICAL when days <= 30", () => {
    expect(determineUrgencyLabel(1, ExpirationConfidence.HIGH)).toBe("CRITICAL");
    expect(determineUrgencyLabel(30, ExpirationConfidence.HIGH)).toBe("CRITICAL");
  });

  test("WARNING when days <= 90", () => {
    expect(determineUrgencyLabel(31, ExpirationConfidence.HIGH)).toBe("WARNING");
    expect(determineUrgencyLabel(90, ExpirationConfidence.HIGH)).toBe("WARNING");
  });

  test("UPCOMING when days <= 365", () => {
    expect(determineUrgencyLabel(91, ExpirationConfidence.HIGH)).toBe("UPCOMING");
    expect(determineUrgencyLabel(365, ExpirationConfidence.HIGH)).toBe("UPCOMING");
  });

  test("ACTIVE when days > 365", () => {
    expect(determineUrgencyLabel(366, ExpirationConfidence.HIGH)).toBe("ACTIVE");
    expect(determineUrgencyLabel(5000, ExpirationConfidence.HIGH)).toBe("ACTIVE");
  });

  test("INDETERMINATE when confidence is INDETERMINATE", () => {
    expect(determineUrgencyLabel(100, ExpirationConfidence.INDETERMINATE)).toBe("INDETERMINATE");
    expect(determineUrgencyLabel(-5, ExpirationConfidence.INDETERMINATE)).toBe("INDETERMINATE");
  });
});

describe("generateSummary", () => {
  test("EXPIRED summary includes days ago", () => {
    const summary = generateSummary("10000000", -30, "EXPIRED", "2025-12-01");
    expect(summary).toContain("expired");
    expect(summary).toContain("30 days ago");
  });

  test("CRITICAL summary includes immediate action", () => {
    const summary = generateSummary("10000000", 15, "CRITICAL", "2026-04-10");
    expect(summary).toContain("immediate action");
    expect(summary).toContain("15 days");
  });

  test("ACTIVE summary includes days remaining", () => {
    const summary = generateSummary("10000000", 2000, "ACTIVE", "2031-06-19");
    expect(summary).toContain("active");
    expect(summary).toContain("2000 days remaining");
  });
});

describe("buildEditorial", () => {
  test("builds complete editorial from expiration result", () => {
    const expirationResult: ExpirationResult = {
      patentId: "US10000000",
      patentType: PatentType.UTILITY,
      expirationDate: d("2035-03-10"),
      breakdown: {
        baseExpirationDate: d("2035-03-10"),
        afterPTA: d("2035-03-10"),
        afterPTE: d("2035-03-10"),
        afterTerminalDisclaimer: d("2035-03-10"),
        finalDate: d("2035-03-10"),
        ptaDaysAdded: 0,
        pteDaysAdded: 0,
        terminalDisclaimerApplied: false,
        lapsedEarlyDueToFees: false,
      },
      confidence: ExpirationConfidence.HIGH,
      confidenceReasons: ["All data available"],
    };

    const now = new Date("2026-03-25");
    const { editorial, daysUntilExpiration } = buildEditorial(expirationResult, now);

    expect(daysUntilExpiration).toBeGreaterThan(365);
    expect(editorial.urgencyLabel).toBe("ACTIVE");
    expect(editorial.summary).toContain("US10000000");
  });
});
