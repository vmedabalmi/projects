import { buildLookaheadWindows, getLookaheadDays } from "../src/lookahead";

describe("getLookaheadDays", () => {
  const originalEnv = process.env.LOOKAHEAD_DAYS;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.LOOKAHEAD_DAYS;
    } else {
      process.env.LOOKAHEAD_DAYS = originalEnv;
    }
  });

  test("returns default [30, 60, 90] when env not set", () => {
    delete process.env.LOOKAHEAD_DAYS;
    expect(getLookaheadDays()).toEqual([30, 60, 90]);
  });

  test("parses comma-separated values from env", () => {
    process.env.LOOKAHEAD_DAYS = "14,30,60,90,180";
    expect(getLookaheadDays()).toEqual([14, 30, 60, 90, 180]);
  });

  test("returns default for invalid env value", () => {
    process.env.LOOKAHEAD_DAYS = "abc,xyz";
    expect(getLookaheadDays()).toEqual([30, 60, 90]);
  });

  test("sorts values", () => {
    process.env.LOOKAHEAD_DAYS = "90,30,60";
    expect(getLookaheadDays()).toEqual([30, 60, 90]);
  });
});

describe("buildLookaheadWindows", () => {
  const now = new Date("2026-03-25");

  test("30-day window: exactly at boundary", () => {
    // Patent expires in exactly 30 days
    const windows = buildLookaheadWindows(30, now);
    const w30 = windows.find((w) => w.days === 30);
    expect(w30).toBeDefined();
    expect(w30?.isPastExpiration).toBe(true); // 30 >= 30
    expect(w30?.date).toBe("2026-04-24");
  });

  test("31 days until expiration: 30-day window is not past", () => {
    const windows = buildLookaheadWindows(31, now);
    const w30 = windows.find((w) => w.days === 30);
    expect(w30?.isPastExpiration).toBe(false); // 30 < 31
  });

  test("60-day window boundary", () => {
    const windows = buildLookaheadWindows(60, now);
    const w60 = windows.find((w) => w.days === 60);
    expect(w60?.isPastExpiration).toBe(true); // 60 >= 60

    const w30 = windows.find((w) => w.days === 30);
    expect(w30?.isPastExpiration).toBe(false); // 30 < 60
  });

  test("90-day window boundary", () => {
    const windows = buildLookaheadWindows(90, now);
    const w90 = windows.find((w) => w.days === 90);
    expect(w90?.isPastExpiration).toBe(true); // 90 >= 90

    const w60 = windows.find((w) => w.days === 60);
    expect(w60?.isPastExpiration).toBe(false); // 60 < 90
  });

  test("all windows past when already expired", () => {
    const windows = buildLookaheadWindows(-10, now);
    expect(windows.every((w) => w.isPastExpiration)).toBe(true);
  });

  test("no windows past when far in the future", () => {
    const windows = buildLookaheadWindows(5000, now);
    expect(windows.every((w) => !w.isPastExpiration)).toBe(true);
  });

  test("windows contain correct dates", () => {
    const windows = buildLookaheadWindows(100, now);
    expect(windows).toHaveLength(3);
    expect(windows[0].days).toBe(30);
    expect(windows[1].days).toBe(60);
    expect(windows[2].days).toBe(90);
  });
});
