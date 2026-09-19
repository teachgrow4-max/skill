function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // murmur3 finalizer — FNV-1a alone mixes poorly when inputs differ only near the end.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Deterministic pseudo-random ordering: the same seed always yields the same
 * order, a different seed yields a different one. Each id is ranked by a hash
 * of `seed + id` rather than by a Fisher-Yates pass over the array, so an id's
 * rank relative to the others doesn't depend on what else is in the list — a
 * reel posted mid-scroll slots in somewhere without reshuffling everything
 * already paged through (which would show repeats and skip others).
 */
export function orderBySeed(ids: string[], seed: string): string[] {
  const keys = new Map(ids.map((id) => [id, hash32(`${seed}:${id}`)]));
  return [...ids].sort((a, b) => {
    const diff = (keys.get(a) ?? 0) - (keys.get(b) ?? 0);
    if (diff !== 0) return diff;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}
