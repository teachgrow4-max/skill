import { describe, expect, it } from "vitest";
import { orderBySeed } from "./reel-order";

const ids = Array.from({ length: 40 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);

describe("orderBySeed", () => {
  it("returns the same order for the same seed", () => {
    expect(orderBySeed(ids, "abc")).toEqual(orderBySeed(ids, "abc"));
  });

  it("returns a different order for a different seed", () => {
    expect(orderBySeed(ids, "abc")).not.toEqual(orderBySeed(ids, "xyz"));
  });

  it("is a permutation: nothing dropped, nothing duplicated", () => {
    const ordered = orderBySeed(ids, "abc");
    expect(ordered).toHaveLength(ids.length);
    expect(new Set(ordered)).toEqual(new Set(ids));
  });

  it("does not just hand the input back in its original (newest-first) order", () => {
    expect(orderBySeed(ids, "abc")).not.toEqual(ids);
  });

  it("does not mutate its input", () => {
    const copy = [...ids];
    orderBySeed(ids, "abc");
    expect(ids).toEqual(copy);
  });

  it("keeps existing ids in the same relative order when new ones are added", () => {
    const before = orderBySeed(ids.slice(0, 30), "abc");
    const after = orderBySeed(ids, "abc").filter((id) => ids.slice(0, 30).includes(id));
    expect(after).toEqual(before);
  });

  it("puts each id first about equally often across seeds (no positional bias)", () => {
    const four = ids.slice(0, 4);
    const firsts = new Map<string, number>();
    for (let s = 0; s < 400; s++) {
      const first = orderBySeed(four, `seed-${s}`)[0];
      firsts.set(first, (firsts.get(first) ?? 0) + 1);
    }
    for (const id of four) {
      expect(firsts.get(id) ?? 0).toBeGreaterThan(60);
      expect(firsts.get(id) ?? 0).toBeLessThan(140);
    }
  });
});
