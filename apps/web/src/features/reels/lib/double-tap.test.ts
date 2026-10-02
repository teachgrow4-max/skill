import { describe, expect, it } from "vitest";
import { DOUBLE_TAP_MAX_DISTANCE_PX, DOUBLE_TAP_MS, isDoubleTap } from "./double-tap";

const first = { time: 1000, x: 200, y: 300 };

describe("isDoubleTap", () => {
  it("is false for the first tap", () => {
    expect(isDoubleTap(null, first)).toBe(false);
  });

  it("is true for a quick second tap in about the same spot", () => {
    expect(isDoubleTap(first, { time: 1150, x: 210, y: 295 })).toBe(true);
  });

  it("is false once the double-tap window has passed", () => {
    expect(isDoubleTap(first, { time: 1000 + DOUBLE_TAP_MS - 1, x: 200, y: 300 })).toBe(true);
    expect(isDoubleTap(first, { time: 1000 + DOUBLE_TAP_MS, x: 200, y: 300 })).toBe(false);
  });

  it("is false when the second tap lands far from the first", () => {
    expect(isDoubleTap(first, { time: 1100, x: 200 + DOUBLE_TAP_MAX_DISTANCE_PX, y: 300 })).toBe(true);
    expect(isDoubleTap(first, { time: 1100, x: 200 + DOUBLE_TAP_MAX_DISTANCE_PX + 1, y: 300 })).toBe(false);
  });
});
