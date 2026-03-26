import { mergePartials } from "../src/merger";
import type { PatentRecord } from "../src/types/index";

describe("merger", () => {
  test("merges fields from multiple sources", () => {
    const pvPartial: Partial<PatentRecord> = {
      patentId: "US10000000",
      patentType: "utility",
      patentDate: "2018-06-19",
      applicationDate: "2015-03-10",
      title: "Coherent LADAR",
      assignees: ["Raytheon Company"],
      inventors: ["Joseph Marron"],
      cpcCodes: ["G01S17/894"],
    };

    const mfPartial: Partial<PatentRecord> = {
      patentId: "US10000000",
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
    };

    const pcPartial: Partial<PatentRecord> = {
      patentId: "US10000000",
      ptaDays: 210,
    };

    const merged = mergePartials([pvPartial, mfPartial, pcPartial]);

    expect(merged.patentId).toBe("US10000000");
    expect(merged.title).toBe("Coherent LADAR");
    expect(merged.maintenanceFeeStatus?.expired).toBe(false);
    expect(merged.ptaDays).toBe(210);
    expect(merged.assignees).toEqual(["Raytheon Company"]);
    expect(merged.inventors).toEqual(["Joseph Marron"]);
    expect(merged.cpcCodes).toEqual(["G01S17/894"]);
  });

  test("later sources override earlier for the same field", () => {
    const first: Partial<PatentRecord> = {
      patentId: "US10000000",
      title: "Old title",
    };

    const second: Partial<PatentRecord> = {
      patentId: "US10000000",
      title: "Updated title",
    };

    const merged = mergePartials([first, second]);
    expect(merged.title).toBe("Updated title");
  });

  test("handles empty partials gracefully", () => {
    const merged = mergePartials([{}, {}, {}]);
    expect(merged).toEqual({});
  });

  test("handles single source with partial data", () => {
    const partial: Partial<PatentRecord> = {
      patentId: "US10000000",
      ptaDays: 100,
    };

    const merged = mergePartials([partial]);
    expect(merged.patentId).toBe("US10000000");
    expect(merged.ptaDays).toBe(100);
    expect(merged.title).toBeUndefined();
    expect(merged.maintenanceFeeStatus).toBeUndefined();
  });
});
