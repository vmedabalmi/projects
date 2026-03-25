import nock from "nock";
import {
  fetchPatentsViewById,
  fetchPatentsViewPage,
  transformPatentsView,
} from "../src/sources/patentsview";
import type { RawPatentsViewRecord, RawPatentsViewResponse } from "../src/types/raw";

const TEST_BASE_URL = "http://patentsview.test";

beforeAll(() => {
  process.env.PATENTSVIEW_API_URL = TEST_BASE_URL;
  process.env.INGESTION_MAX_RPS = "1000"; // no rate limiting in tests
});

afterEach(() => {
  nock.cleanAll();
});

const sampleRecord: RawPatentsViewRecord = {
  patent_id: "10000000",
  patent_type: "utility",
  patent_date: "2018-06-19",
  app_date: "2015-03-10",
  patent_title: "Coherent LADAR using intra-pixel quadrature detection",
  assignees: [
    {
      assignee_first_name: null,
      assignee_last_name: null,
      assignee_organization: "Raytheon Company",
    },
  ],
  inventors: [
    {
      inventor_first_name: "Joseph",
      inventor_last_name: "Marron",
    },
  ],
  cpcs: [{ cpc_subgroup_id: "G01S17/894" }],
};

const sampleResponse: RawPatentsViewResponse = {
  patents: [sampleRecord],
  count: 1,
  total_patent_count: 1,
};

describe("PatentsView adapter", () => {
  test("fetchPatentsViewById returns a record on success", async () => {
    nock(TEST_BASE_URL)
      .get(/\/query/)
      .reply(200, sampleResponse);

    const result = await fetchPatentsViewById("10000000");
    expect(result).not.toBeNull();
    expect(result?.patent_id).toBe("10000000");
    expect(result?.patent_title).toContain("Coherent LADAR");
  });

  test("fetchPatentsViewById returns null when no patents found", async () => {
    nock(TEST_BASE_URL)
      .get(/\/query/)
      .reply(200, { patents: [], count: 0, total_patent_count: 0 });

    const result = await fetchPatentsViewById("99999999");
    expect(result).toBeNull();
  });

  test("retry on 429", async () => {
    nock(TEST_BASE_URL)
      .get(/\/query/)
      .reply(429, "Too Many Requests");

    nock(TEST_BASE_URL)
      .get(/\/query/)
      .reply(200, sampleResponse);

    const result = await fetchPatentsViewById("10000000");
    expect(result).not.toBeNull();
    expect(result?.patent_id).toBe("10000000");
  });

  test("transformPatentsView maps fields correctly", () => {
    const partial = transformPatentsView(sampleRecord);

    expect(partial.patentId).toBe("10000000");
    expect(partial.patentType).toBe("utility");
    expect(partial.patentDate).toBe("2018-06-19");
    expect(partial.applicationDate).toBe("2015-03-10");
    expect(partial.title).toContain("Coherent LADAR");
    expect(partial.assignees).toEqual(["Raytheon Company"]);
    expect(partial.inventors).toEqual(["Joseph Marron"]);
    expect(partial.cpcCodes).toEqual(["G01S17/894"]);
    // Fields not provided by this source
    expect(partial.maintenanceFeeStatus).toBeUndefined();
    expect(partial.ptaDays).toBeUndefined();
  });
});
