import { expireRecord } from "../src/index";
import { PatentType, MaintenanceFeeWindow } from "@patentproject/expiration";
import type { PatentRecord } from "@patentproject/expiration";

function d(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

// Fixture matching the new expiration module's PatentRecord
const fixture: PatentRecord = {
  patentId: "US10000000",
  patentType: PatentType.UTILITY,
  filingDate: d("2015-03-10"),
  grantDate: d("2018-06-19"),
  isInternational: false,
};

describe("expireRecord integration", () => {
  const now = new Date("2026-03-25");

  test("produces full output shape for a real-shaped record", () => {
    const result = expireRecord(fixture, now);

    expect(result.patentId).toBe("US10000000");
    expect(result.expirationDate).toBeDefined();
    expect(result.baseExpirationDate).toBeDefined();
    expect(typeof result.adjustedDays).toBe("number");
    expect(typeof result.daysUntilExpiration).toBe("number");
    expect(result.confidence).toBeDefined();
    expect(result.factors).toBeInstanceOf(Array);

    // Editorial
    expect(result.editorial).toBeDefined();
    expect(result.editorial.urgencyLabel).toBeDefined();
    expect(result.editorial.summary).toContain("US10000000");

    // Lookahead
    expect(result.lookahead).toBeInstanceOf(Array);
    expect(result.lookahead.length).toBeGreaterThan(0);
    result.lookahead.forEach((w) => {
      expect(typeof w.days).toBe("number");
      expect(typeof w.date).toBe("string");
      expect(typeof w.isPastExpiration).toBe("boolean");
    });
  });

  test("utility patent: filing date + 20 years", () => {
    const result = expireRecord(fixture, now);
    expect(result.baseExpirationDate).toBe("2035-03-10");
  });

  test("ACTIVE label for patent expiring far in the future", () => {
    const result = expireRecord(fixture, now);
    expect(result.editorial.urgencyLabel).toBe("ACTIVE");
    expect(result.daysUntilExpiration).toBeGreaterThan(365);
  });

  test("design patent: filing date + 15 years", () => {
    const designPatent: PatentRecord = {
      ...fixture,
      patentId: "USD900000",
      patentType: PatentType.DESIGN,
      filingDate: d("2016-01-01"),
    };

    const result = expireRecord(designPatent, now);
    expect(result.baseExpirationDate).toBe("2031-01-01");
  });

  test("PTA adjustment extends expiration", () => {
    const withPTA: PatentRecord = {
      ...fixture,
      pta: {
        aDelayDays: 200,
        bDelayDays: 100,
        cDelayDays: 100,
        applicantDelayDays: 0,
        overlapDays: 35,
        totalPTADays: 365,
      },
    };

    const result = expireRecord(withPTA, now);
    expect(result.adjustedDays).toBe(365);
    expect(result.factors.some((f) => f.type === "PTA")).toBe(true);
  });

  test("expired patent by maintenance fee lapse", () => {
    const lapsed: PatentRecord = {
      ...fixture,
      maintenanceFees: [
        {
          window: MaintenanceFeeWindow.YEAR_3_5,
          deadline: d("2022-06-19"),
          graceEnd: d("2022-12-19"),
          paid: false,
          revived: false,
        },
      ],
    };

    const result = expireRecord(lapsed, now);
    expect(result.editorial.urgencyLabel).toBe("EXPIRED");
    expect(result.expirationDate).toBe("2022-12-19");
    expect(result.factors.some((f) => f.type === "MAINTENANCE_FEE_LAPSE")).toBe(true);
  });

  test("indeterminate confidence for international patent", () => {
    const intl: PatentRecord = {
      ...fixture,
      isInternational: true,
    };

    const result = expireRecord(intl, now);
    expect(result.editorial.urgencyLabel).toBe("INDETERMINATE");
  });

  test("lookahead windows present in output", () => {
    const result = expireRecord(fixture, now);
    expect(result.lookahead).toHaveLength(3);
    expect(result.lookahead[0].days).toBe(30);
    expect(result.lookahead[1].days).toBe(60);
    expect(result.lookahead[2].days).toBe(90);
  });
});
