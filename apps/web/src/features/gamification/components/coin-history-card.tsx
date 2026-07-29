import type { SkillCoinEvent } from "@skilltego/types";

interface CoinHistoryCardProps {
  history: SkillCoinEvent[];
}

function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  );
}

export function CoinHistoryCard({ history }: CoinHistoryCardProps) {
  return (
    <div className="glass mt-6 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Skill Coin History</h2>

      {history.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No activity yet — start earning Skill Coins to see your history here.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {history.map((event, index) => (
            <li
              key={`${event.createdAt}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div>
                <p className="text-sm font-medium">{event.reason}</p>
                <p className="text-xs text-muted-foreground">{formatEventDate(event.createdAt)}</p>
              </div>
              <span
                className={
                  event.amount >= 0
                    ? "whitespace-nowrap rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success"
                    : "whitespace-nowrap rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive"
                }
              >
                {event.amount >= 0 ? `+${event.amount}` : event.amount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
