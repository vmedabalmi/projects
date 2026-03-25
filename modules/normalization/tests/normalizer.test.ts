import { normalizeRecord } from "../src/normalizer";
import { PatentType } from "../src/types/index";
import type { IngestionPatentRecord } from "../src/types/index";

// Fixture that matches the shape of real merged files from ingestion
const fullFixture: IngestionPatentRecord = {
  patentId: "10000000",
  patentType: "utility",
  patentDate: "2018-06-19",
  applicationDate: "2015-03-10",
  title: "Coherent LADAR using intra-pixel quadrature detection",
  assignees: ["Raytheon Company"],
  inventors: ["Joseph Marron"],
  cpcCodes: ["G01S17/894"],
  maintenanceFeeStatus: {
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
  },
  ptaDays: 210,
};

describe("normalizer integration", () => {
  test("happy path: normalizes a complete record", () => {
    const result = normalizeRecord(fullFixture);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.record).toBeDefined();

    const rec = result.record!;
    expect(rec.patentId).toBe("10000000");
    expect(rec.patentType).toBe(PatentType.UTILITY);
    expect(rec.filingDate).toBe("2015-03-10");
    expect(rec.grantDate).toBe("2018-06-19");
    expect(rec.title).toBe("Coherent LADAR using intra-pixel quadrature detection");
    expect(rec.assignees).toEqual(["Raytheon Company"]);
    expect(rec.inventors).toEqual(["Joseph Marron"]);
    expect(rec.cpcCodes).toEqual(["G01S17/894"]);
    expect(rec.isInternational).toBe(false);
    expect(rec.pta?.totalPTADays).toBe(210);
    expect(rec.maintenanceFees?.feeWindows).toHaveLength(1);
  });

  test("fails when patentId is missing", () => {
    const input: IngestionPatentRecord = {
      ...fullFixture,
      patentId: undefined,
    };

    const result = normalizeRecord(input);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === "patentId")).toBe(true);
    expect(result.record).toBeUndefined();
  });

  test("fails when filingDate is missing", () => {
    const input: IngestionPatentRecord = {
      ...fullFixture,
      applicationDate: undefined,
    };

    const result = normalizeRecord(input);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === "filingDate")).toBe(true);
  });

  test("fails when grantDate is missing", () => {
    const input: IngestionPatentRecord = {
      ...fullFixture,
      patentDate: undefined,
    };

    const result = normalizeRecord(input);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === "grantDate")).toBe(true);
  });

  test("fails on invalid date format", () => {
    const input: IngestionPatentRecord = {
      ...fullFixture,
      applicationDate: "not-a-date",
    };

    const result = normalizeRecord(input);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.field === "filingDate")).toBe(true);
  });

  test("coerces unknown patent type to UTILITY with warning", () => {
    const input: IngestionPatentRecord = {
      ...fullFixture,
      patentType: "reissue",
    };

    const result = normalizeRecord(input);
    expect(result.success).toBe(true);
    expect(result.record?.patentType).toBe(PatentType.UTILITY);
    expect(result.warnings.some((w) => w.field === "patentType")).toBe(true);
  });

  test("handles minimal record with only required fields", () => {
    const input: IngestionPatentRecord = {
      patentId: "99999999",
      patentType: "utility",
      patentDate: "2020-01-01",
      applicationDate: "2018-01-01",
    };

    const result = normalizeRecord(input);
    expect(result.success).toBe(true);
    expect(result.record?.title).toBe("");
    expect(result.record?.assignees).toEqual([]);
    expect(result.record?.isInternational).toBe(false);
    expect(result.record?.pta).toBeUndefined();
    expect(result.record?.pte).toBeUndefined();
    expect(result.record?.maintenanceFees).toBeUndefined();
  });

  test("PTE cap enforcement: clamps extensionDays to 1825", () => {
    const input: IngestionPatentRecord = {
      ...fullFixture,
      pte: { extensionDays: 3000, granted: true, pendingApplication: false },
    };

    const result = normalizeRecord(input);
    expect(result.success).toBe(true);
    expect(result.record?.pte?.extensionDays).toBe(1825);
    expect(result.warnings.some((w) => w.field === "pte.extensionDays")).toBe(true);
  });

  test("PTE: granted and pending simultaneously trusts granted", () => {
    const input: IngestionPatentRecord = {
      ...fullFixture,
      pte: { extensionDays: 100, granted: true, pendingApplication: true },
    };

    const result = normalizeRecord(input);
    expect(result.success).toBe(true);
    expect(result.record?.pte?.granted).toBe(true);
    expect(result.record?.pte?.pendingApplication).toBe(false);
    expect(result.warnings.some((w) => w.field === "pte")).toBe(true);
  });

  test("never throws on bad data", () => {
    const garbage = {
      patentId: 12345,
      patentType: null,
      patentDate: {},
      applicationDate: [],
    } as unknown as IngestionPatentRecord;

    expect(() => normalizeRecord(garbage)).not.toThrow();
    const result = normalizeRecord(garbage);
    expect(result.success).toBe(false);
  });
});
