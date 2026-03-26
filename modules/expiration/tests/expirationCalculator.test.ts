import { calculateExpiration } from "../src/expirationCalculator";
import {
  PatentType,
  MaintenanceFeeWindow,
  ExpirationConfidence,
} from "../src/types/index";
import type { PatentRecord } from "../src/types/index";

function d(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

function baseUtility(overrides?: Partial<PatentRecord>): PatentRecord {
  return {
    patentId: "US10000000",
    patentType: PatentType.UTILITY,
    filingDate: d("2010-03-15"),
    grantDate: d("2013-06-18"),
    isInternational: false,
    ...overrides,
  };
}

// --- Utility patent tests ---

describe("Utility patent — post-GATT", () => {
  test("expires 20 years from filing date", () => {
    const record = baseUtility({ filingDate: d("2010-03-15") });
    const result = calculateExpiration(record);

    expect(result.expirationDate).toEqual(d("2030-03-15"));
    expect(result.breakdown.baseExpirationDate).toEqual(d("2030-03-15"));
  });
});

describe("Utility patent — pre-GATT", () => {
  test("uses MAX(17yr from grant, 20yr from filing)", () => {
    // Filed 1994-01-10, granted 1996-06-01
    // 20yr from filing = 2014-01-10
    // 17yr from grant  = 2013-06-01
    // MAX = 2014-01-10
    const record = baseUtility({
      filingDate: d("1994-01-10"),
      grantDate: d("1996-06-01"),
    });
    const result = calculateExpiration(record);

    expect(result.expirationDate).toEqual(d("2014-01-10"));
  });

  test("17yr from grant wins when it is later", () => {
    // Filed 1993-01-01, granted 1998-06-01
    // 20yr from filing = 2013-01-01
    // 17yr from grant  = 2015-06-01
    // MAX = 2015-06-01
    const record = baseUtility({
      filingDate: d("1993-01-01"),
      grantDate: d("1998-06-01"),
    });
    const result = calculateExpiration(record);

    expect(result.expirationDate).toEqual(d("2015-06-01"));
  });
});

// --- Design patent tests ---

describe("Design patent — post-2015", () => {
  test("expires 15 years from filing date", () => {
    const record = baseUtility({
      patentType: PatentType.DESIGN,
      filingDate: d("2016-08-01"),
      grantDate: d("2018-02-15"),
    });
    const result = calculateExpiration(record);

    expect(result.expirationDate).toEqual(d("2031-08-01"));
  });
});

describe("Design patent — pre-2015", () => {
  test("expires 14 years from grant date", () => {
    const record = baseUtility({
      patentType: PatentType.DESIGN,
      filingDate: d("2013-03-01"),
      grantDate: d("2014-09-10"),
    });
    const result = calculateExpiration(record);

    expect(result.expirationDate).toEqual(d("2028-09-10"));
  });
});

// --- Plant patent tests ---

describe("Plant patent", () => {
  test("expires 20 years from grant date", () => {
    const record = baseUtility({
      patentType: PatentType.PLANT,
      filingDate: d("2005-04-20"),
      grantDate: d("2008-11-11"),
    });
    const result = calculateExpiration(record);

    expect(result.expirationDate).toEqual(d("2028-11-11"));
  });
});

// --- PTA modifier tests ---

describe("PTA modifier", () => {
  test("adds PTA days to utility patent", () => {
    const record = baseUtility({
      filingDate: d("2010-01-01"),
      pta: {
        aDelayDays: 100,
        bDelayDays: 50,
        cDelayDays: 0,
        applicantDelayDays: 10,
        overlapDays: 5,
        totalPTADays: 135,
      },
    });
    const result = calculateExpiration(record);

    // 2030-01-01 + 135 days = 2030-05-16
    expect(result.breakdown.ptaDaysAdded).toBe(135);
    expect(result.expirationDate).toEqual(d("2030-05-16"));
  });

  test("PTA is NOT applied to design patents", () => {
    const record = baseUtility({
      patentType: PatentType.DESIGN,
      filingDate: d("2016-01-01"),
      grantDate: d("2018-01-01"),
      pta: {
        aDelayDays: 100,
        bDelayDays: 0,
        cDelayDays: 0,
        applicantDelayDays: 0,
        overlapDays: 0,
        totalPTADays: 100,
      },
    });
    const result = calculateExpiration(record);

    expect(result.breakdown.ptaDaysAdded).toBe(0);
    // 15yr from filing: 2031-01-01 (no PTA)
    expect(result.expirationDate).toEqual(d("2031-01-01"));
  });
});

// --- PTE modifier tests ---

describe("PTE modifier", () => {
  test("PTE capped at 1825 days", () => {
    const record = baseUtility({
      filingDate: d("2010-01-01"),
      pte: {
        granted: true,
        pendingApplication: false,
        extensionDays: 3000,
      },
    });
    const result = calculateExpiration(record);

    expect(result.breakdown.pteDaysAdded).toBe(1825);
    // 2030-01-01 + 1825 days = 2034-12-31
    expect(result.expirationDate).toEqual(d("2034-12-31"));
  });

  test("PTE under cap applied fully", () => {
    const record = baseUtility({
      filingDate: d("2010-01-01"),
      pte: {
        granted: true,
        pendingApplication: false,
        extensionDays: 365,
      },
    });
    const result = calculateExpiration(record);

    expect(result.breakdown.pteDaysAdded).toBe(365);
    // 2030-01-01 + 365 days = 2031-01-01 (2030 is not a leap year)
    expect(result.expirationDate).toEqual(d("2031-01-01"));
  });
});

// --- Terminal disclaimer tests ---

describe("Terminal disclaimer", () => {
  test("caps expiration at limiting date", () => {
    const record = baseUtility({
      filingDate: d("2010-01-01"),
      terminalDisclaimer: {
        filedDate: d("2012-05-01"),
        limitingPatentId: "US9000000",
        limitingDate: d("2028-06-15"),
      },
    });
    const result = calculateExpiration(record);

    // Base: 2030-01-01, limiting: 2028-06-15
    expect(result.expirationDate).toEqual(d("2028-06-15"));
    expect(result.breakdown.terminalDisclaimerApplied).toBe(true);
  });

  test("does not extend expiration past base", () => {
    const record = baseUtility({
      filingDate: d("2010-01-01"),
      terminalDisclaimer: {
        filedDate: d("2012-05-01"),
        limitingPatentId: "US9000000",
        limitingDate: d("2035-01-01"),
      },
    });
    const result = calculateExpiration(record);

    // Base: 2030-01-01, limiting: 2035-01-01 — base wins
    expect(result.expirationDate).toEqual(d("2030-01-01"));
    expect(result.breakdown.terminalDisclaimerApplied).toBe(false);
  });
});

// --- Maintenance fee lapse tests ---

describe("Maintenance fee lapse", () => {
  test("unpaid fee sets early expiration", () => {
    const record = baseUtility({
      filingDate: d("2005-01-01"),
      grantDate: d("2008-06-01"),
      maintenanceFees: [
        {
          window: MaintenanceFeeWindow.YEAR_3_5,
          deadline: d("2011-12-01"),
          graceEnd: d("2012-06-01"),
          paid: true,
          revived: false,
        },
        {
          window: MaintenanceFeeWindow.YEAR_7_5,
          deadline: d("2016-06-01"),
          graceEnd: d("2016-12-01"),
          paid: false,
          revived: false,
        },
      ],
    });
    const result = calculateExpiration(record);

    expect(result.expirationDate).toEqual(d("2016-12-01"));
    expect(result.breakdown.lapsedEarlyDueToFees).toBe(true);
    expect(result.breakdown.lapseWindow).toBe(MaintenanceFeeWindow.YEAR_7_5);
  });

  test("revival prevents lapse", () => {
    const record = baseUtility({
      filingDate: d("2005-01-01"),
      grantDate: d("2008-06-01"),
      maintenanceFees: [
        {
          window: MaintenanceFeeWindow.YEAR_7_5,
          deadline: d("2016-06-01"),
          graceEnd: d("2016-12-01"),
          paid: false,
          revived: true,
        },
      ],
    });
    const result = calculateExpiration(record);

    // 20yr from filing: 2025-01-01
    expect(result.expirationDate).toEqual(d("2025-01-01"));
    expect(result.breakdown.lapsedEarlyDueToFees).toBe(false);
  });
});

// --- Confidence scoring tests ---

describe("Confidence scoring", () => {
  test("HIGH for clean record", () => {
    const record = baseUtility();
    const result = calculateExpiration(record);

    expect(result.confidence).toBe(ExpirationConfidence.HIGH);
  });

  test("INDETERMINATE for international patent", () => {
    const record = baseUtility({ isInternational: true });
    const result = calculateExpiration(record);

    expect(result.confidence).toBe(ExpirationConfidence.INDETERMINATE);
    expect(result.confidenceReasons[0]).toContain("International");
  });

  test("LOW for pending PTE application", () => {
    const record = baseUtility({
      pte: {
        granted: false,
        pendingApplication: true,
        extensionDays: 0,
      },
    });
    const result = calculateExpiration(record);

    expect(result.confidence).toBe(ExpirationConfidence.LOW);
    expect(result.confidenceReasons[0]).toContain("pending");
  });

  test("MEDIUM when terminal disclaimer present", () => {
    const record = baseUtility({
      terminalDisclaimer: {
        filedDate: d("2012-01-01"),
        limitingPatentId: "US9000000",
        limitingDate: d("2035-01-01"),
      },
    });
    const result = calculateExpiration(record);

    expect(result.confidence).toBe(ExpirationConfidence.MEDIUM);
  });
});
