import nock from "nock";
import {
  fetchMaintenanceFee,
  transformMaintenanceFee,
} from "../src/sources/maintenanceFees";
import type { RawMaintenanceFeeRecord } from "../src/types/raw";

const TEST_BASE_URL = "http://maintenance-fees.test";

beforeAll(() => {
  process.env.USPTO_MAINTENANCE_FEE_API_URL = TEST_BASE_URL;
  process.env.INGESTION_MAX_RPS = "1000";
});

afterEach(() => {
  nock.cleanAll();
});

const sampleRecord: RawMaintenanceFeeRecord = {
  patent_number: "10000000",
  small_entity: false,
  fee_events: [
    {
      fee_code: "M1551",
      due_date: "2022-06-19",
      paid_date: "2022-05-01",
      status: "paid",
    },
    {
      fee_code: "M1552",
      due_date: "2026-06-19",
      paid_date: null,
      status: "unpaid",
    },
  ],
  expired: false,
};

describe("Maintenance Fees adapter", () => {
  test("fetchMaintenanceFee returns record on success", async () => {
    nock(TEST_BASE_URL).get("/10000000").reply(200, sampleRecord);

    const result = await fetchMaintenanceFee("10000000");
    expect(result.patent_number).toBe("10000000");
    expect(result.fee_events).toHaveLength(2);
  });

  test("retry on 503", async () => {
    nock(TEST_BASE_URL).get("/10000000").reply(503, "Service Unavailable");
    nock(TEST_BASE_URL).get("/10000000").reply(200, sampleRecord);

    const result = await fetchMaintenanceFee("10000000");
    expect(result.patent_number).toBe("10000000");
  });

  test("transformMaintenanceFee maps fields correctly", () => {
    const partial = transformMaintenanceFee(sampleRecord);

    expect(partial.patentId).toBe("10000000");
    expect(partial.maintenanceFeeStatus).toBeDefined();
    expect(partial.maintenanceFeeStatus?.expired).toBe(false);
    expect(partial.maintenanceFeeStatus?.smallEntityStatus).toBe(false);
    expect(partial.maintenanceFeeStatus?.feeWindows).toHaveLength(2);
    expect(partial.maintenanceFeeStatus?.feeWindows[0].status).toBe("paid");
    expect(partial.maintenanceFeeStatus?.feeWindows[0].paidDate).toBe("2022-05-01");
    expect(partial.maintenanceFeeStatus?.feeWindows[1].paidDate).toBeUndefined();
    // Fields not provided by this source
    expect(partial.title).toBeUndefined();
    expect(partial.ptaDays).toBeUndefined();
  });
});
