/** A second tap within this many ms of the first counts as a double tap. */
export const DOUBLE_TAP_MS = 300;
/** ...and only if it lands this close (px) to the first — a tap elsewhere is a new tap. */
export const DOUBLE_TAP_MAX_DISTANCE_PX = 100;

export interface Tap {
  time: number;
  x: number;
  y: number;
}

/** True when `tap` follows `previous` quickly and closely enough to be a double tap. */
export function isDoubleTap(previous: Tap | null, tap: Tap): boolean {
  if (!previous) return false;
  return (
    tap.time - previous.time < DOUBLE_TAP_MS &&
    Math.hypot(tap.x - previous.x, tap.y - previous.y) <= DOUBLE_TAP_MAX_DISTANCE_PX
  );
}
