import { normalizePatentType } from "../src/normalizers/patentType";
import { PatentType } from "../src/types/index";

describe("normalizePatentType", () => {
  test.each([
    ["utility", PatentType.UTILITY],
    ["1", PatentType.UTILITY],
    ["U", PatentType.UTILITY],
    ["u", PatentType.UTILITY],
    ["design", PatentType.DESIGN],
    ["2", PatentType.DESIGN],
    ["D", PatentType.DESIGN],
    ["plant", PatentType.PLANT],
    ["3", PatentType.PLANT],
    ["P", PatentType.PLANT],
  ])("maps '%s' to %s", (input, expected) => {
    const result = normalizePatentType(input);
    expect(result.value).toBe(expected);
    expect(result.warning).toBeUndefined();
  });

  test("defaults unknown type to UTILITY with warning", () => {
    const result = normalizePatentType("reissue");
    expect(result.value).toBe(PatentType.UTILITY);
    expect(result.warning).toBeDefined();
    expect(result.warning?.message).toContain("Unrecognized");
  });

  test("defaults missing type to UTILITY with warning", () => {
    const result = normalizePatentType(undefined);
    expect(result.value).toBe(PatentType.UTILITY);
    expect(result.warning).toBeDefined();
    expect(result.warning?.message).toContain("missing");
  });

  test("handles case-insensitive input", () => {
    const result = normalizePatentType("UTILITY");
    expect(result.value).toBe(PatentType.UTILITY);
    expect(result.warning).toBeUndefined();
  });

  test("trims whitespace", () => {
    const result = normalizePatentType("  design  ");
    expect(result.value).toBe(PatentType.DESIGN);
    expect(result.warning).toBeUndefined();
  });
});
