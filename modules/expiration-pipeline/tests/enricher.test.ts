import {
  calculateDaysUntilExpiration,
  determineUrgencyLabel,
  generateSummary,
  buildEditorial,
} from "../src/enricher";
import type { ExpirationResult } from "@patentproject/expiration";
import { Confidence } from "@patentproject/expiration";

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
    expect(determineUrgencyLabel(0, Confidence.HIGH)).toBe("EXPIRED");
    expect(determineUrgencyLabel(-10, Confidence.HIGH)).toBe("EXPIRED");
  });

  test("CRITICAL when days <= 30", () => {
    expect(determineUrgencyLabel(1, Confidence.HIGH)).toBe("CRITICAL");
    expect(determineUrgencyLabel(30, Confidence.HIGH)).toBe("CRITICAL");
  });

  test("WARNING when days <= 90", () => {
    expect(determineUrgencyLabel(31, Confidence.HIGH)).toBe("WARNING");
    expect(determineUrgencyLabel(90, Confidence.HIGH)).toBe("WARNING");
  });

  test("UPCOMING when days <= 365", () => {
    expect(determineUrgencyLabel(91, Confidence.HIGH)).toBe("UPCOMING");
    expect(determineUrgencyLabel(365, Confidence.HIGH)).toBe("UPCOMING");
  });

  test("ACTIVE when days > 365", () => {
    expect(determineUrgencyLabel(366, Confidence.HIGH)).toBe("ACTIVE");
    expect(determineUrgencyLabel(5000, Confidence.HIGH)).toBe("ACTIVE");
  });

  test("INDETERMINATE when confidence is INDETERMINATE", () => {
    expect(determineUrgencyLabel(100, Confidence.INDETERMINATE)).toBe("INDETERMINATE");
    expect(determineUrgencyLabel(-5, Confidence.INDETERMINATE)).toBe("INDETERMINATE");
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
      patentId: "10000000",
      expirationDate: "2035-03-10",
      baseExpirationDate: "2035-03-10",
      adjustedDays: 0,
      confidence: Confidence.HIGH,
      factors: [],
    };

    const now = new Date("2026-03-25");
    const { editorial, daysUntilExpiration } = buildEditorial(expirationResult, now);

    expect(daysUntilExpiration).toBeGreaterThan(365);
    expect(editorial.urgencyLabel).toBe("ACTIVE");
    expect(editorial.summary).toContain("10000000");
  });
});
