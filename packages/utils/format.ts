export function formatCount(count: number): string {
  if (count < 1000) return String(count);
  if (count < 1_000_000) return `${(count / 1000).toFixed(count % 1000 >= 100 ? 1 : 0)}K`;
  return `${(count / 1_000_000).toFixed(count % 1_000_000 >= 100_000 ? 1 : 0)}M`;
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const ranges: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let unitSeconds = 1;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [limit, unit] of ranges) {
    if (seconds < unitSeconds * limit || limit === Number.POSITIVE_INFINITY) {
      const value = Math.floor(seconds / unitSeconds);
      return rtf.format(-value, unit);
    }
    unitSeconds *= limit;
  }
  return rtf.format(-Math.floor(seconds / unitSeconds), "year");
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
