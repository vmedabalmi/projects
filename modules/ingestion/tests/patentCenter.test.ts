import nock from "nock";
import {
  fetchPatentCenter,
  transformPatentCenter,
} from "../src/sources/patentCenter";
import type { RawPatentCenterRecord } from "../src/types/raw";

const TEST_BASE_URL = "http://patent-center.test";

beforeAll(() => {
  process.env.USPTO_PATENT_CENTER_API_URL = TEST_BASE_URL;
  process.env.INGESTION_MAX_RPS = "1000";
});

afterEach(() => {
  nock.cleanAll();
});

const sampleRecord: RawPatentCenterRecord = {
  application_number: "14644410",
  patent_number: "10000000",
  pta_days: 210,
  continuity_data: [
    {
      parent_application_number: "13123456",
      child_application_number: "14644410",
      relationship_type: "continuation",
    },
  ],
};

describe("Patent Center adapter", () => {
  test("fetchPatentCenter returns record on success", async () => {
    nock(TEST_BASE_URL)
      .get("/patents/applications/14644410/continuity")
      .reply(200, sampleRecord);

    const result = await fetchPatentCenter("14644410");
    expect(result.patent_number).toBe("10000000");
    expect(result.pta_days).toBe(210);
  });

  test("retry on 429", async () => {
    nock(TEST_BASE_URL)
      .get("/patents/applications/14644410/continuity")
      .reply(429, "Too Many Requests");

    nock(TEST_BASE_URL)
      .get("/patents/applications/14644410/continuity")
      .reply(200, sampleRecord);

    const result = await fetchPatentCenter("14644410");
    expect(result.patent_number).toBe("10000000");
  });

  test("transformPatentCenter maps fields correctly", () => {
    const partial = transformPatentCenter(sampleRecord);

    expect(partial.patentId).toBe("10000000");
    expect(partial.ptaDays).toBe(210);
    // Fields not provided by this source
    expect(partial.title).toBeUndefined();
    expect(partial.maintenanceFeeStatus).toBeUndefined();
    expect(partial.assignees).toBeUndefined();
  });
});
