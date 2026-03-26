import { expireRecord } from "../src/index";
import type { PatentRecord } from "@patentproject/expiration";

// Fixture matching real normalized output shape
const fixture: PatentRecord = {
  patentId: "10000000",
  patentType: "UTILITY",
  filingDate: "2015-03-10",
  grantDate: "2018-06-19",
  title: "Coherent LADAR using intra-pixel quadrature detection",
  assignees: ["Raytheon Company"],
  inventors: ["Joseph Marron"],
  cpcCodes: ["G01S17/894"],
  maintenanceFees: {
    feeWindows: [
      {
        window: "FIRST",
        feeCode: "M1551",
        deadline: "2022-06-19",
        graceEnd: "2022-12-19",
        paid: true,
        paidDate: "2022-05-01",
      },
    ],
    smallEntityStatus: false,
    expired: false,
  },
  isInternational: false,
};

describe("expireRecord integration", () => {
  const now = new Date("2026-03-25");

  test("produces full output shape for a real-shaped record", () => {
    const result = expireRecord(fixture, now);

    expect(result.patentId).toBe("10000000");
    expect(result.expirationDate).toBeDefined();
    expect(result.baseExpirationDate).toBeDefined();
    expect(typeof result.adjustedDays).toBe("number");
    expect(typeof result.daysUntilExpiration).toBe("number");
    expect(result.confidence).toBeDefined();
    expect(result.factors).toBeInstanceOf(Array);

    // Editorial
    expect(result.editorial).toBeDefined();
    expect(result.editorial.urgencyLabel).toBeDefined();
    expect(result.editorial.summary).toContain("10000000");

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
    // Filed 2015-03-10, base expiration = 2035-03-10
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
      patentId: "D900000",
      patentType: "DESIGN",
      filingDate: "2016-01-01",
    };

    const result = expireRecord(designPatent, now);
    expect(result.baseExpirationDate).toBe("2031-01-01");
  });

  test("PTA adjustment extends expiration", () => {
    const withPTA: PatentRecord = {
      ...fixture,
      pta: {
        totalPTADays: 365,
        aDelay: 200,
        bDelay: 100,
        cDelay: 100,
        overlap: 35,
      },
    };

    const result = expireRecord(withPTA, now);
    expect(result.adjustedDays).toBe(365);
    // 2035-03-10 + 365 days = 2036-03-09 (2036 is not a leap year adjustment)
    expect(result.expirationDate).toBe("2036-03-09");
    expect(result.factors.some((f) => f.type === "PTA")).toBe(true);
  });

  test("expired patent by maintenance fee lapse", () => {
    const lapsed: PatentRecord = {
      ...fixture,
      maintenanceFees: {
        feeWindows: [
          {
            window: "FIRST",
            feeCode: "M1551",
            deadline: "2022-06-19",
            graceEnd: "2022-12-19",
            paid: false,
          },
        ],
        smallEntityStatus: false,
        expired: true,
      },
    };

    const result = expireRecord(lapsed, now);
    expect(result.editorial.urgencyLabel).toBe("EXPIRED");
    expect(result.expirationDate).toBe("2022-12-19");
    expect(result.factors.some((f) => f.type === "MAINTENANCE_FEE_LAPSE")).toBe(true);
  });

  test("indeterminate confidence produces INDETERMINATE label", () => {
    const noDate: PatentRecord = {
      ...fixture,
      filingDate: "",
      grantDate: "",
    };

    const result = expireRecord(noDate, now);
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
