import { normalizeDate } from "../src/normalizers/dates";

describe("normalizeDate", () => {
  test("parses valid ISO date string", () => {
    const result = normalizeDate("filingDate", "2018-06-19", true);
    expect(result.value).toBe("2018-06-19");
    expect(result.error).toBeUndefined();
  });

  test("parses date with time component", () => {
    const result = normalizeDate("filingDate", "2018-06-19T00:00:00Z", true);
    expect(result.value).toBe("2018-06-19");
    expect(result.error).toBeUndefined();
  });

  test("returns error for missing required date", () => {
    const result = normalizeDate("filingDate", undefined, true);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.field).toBe("filingDate");
    expect(result.error?.message).toContain("missing");
  });

  test("returns undefined without error for missing optional date", () => {
    const result = normalizeDate("optionalDate", undefined, false);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeUndefined();
  });

  test("returns error for invalid date string", () => {
    const result = normalizeDate("filingDate", "not-a-date", true);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain("not a valid date");
  });

  test("returns error for non-string input", () => {
    const result = normalizeDate("filingDate", 12345, true);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain("must be a string");
  });

  test("returns error for empty string on required field", () => {
    const result = normalizeDate("filingDate", "", true);
    expect(result.value).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
