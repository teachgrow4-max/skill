import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@skilltego/ui";
import { cn, initials } from "@skilltego/utils";
import { getLeaderboardAction } from "@/features/gamification/actions";

export const metadata: Metadata = { title: "Leaderboard" };

const PODIUM_STYLE: Record<number, { card: string; medallion: string; rank: string }> = {
  1: {
    card: "border-[#d4af3766] shadow-[0_10px_30px_#d4af3726]",
    medallion: "radial-gradient(circle at 35% 30%, #fff4d1, #d4af37 55%, #8a6a1f)",
    rank: "text-[#d4af37]",
  },
  2: {
    card: "border-[#d9d9d966] shadow-[0_10px_30px_#d9d9d91f]",
    medallion: "radial-gradient(circle at 35% 30%, #f5f5f5, #d9d9d9 55%, #8b8b93)",
    rank: "text-foreground",
  },
  3: {
    card: "border-[#6b728066] shadow-[0_10px_30px_#6b728020]",
    medallion: "radial-gradient(circle at 35% 30%, #9ca3af, #6b7280 55%, #3f3f46)",
    rank: "text-muted-foreground",
  },
};

export default async function LeaderboardPage() {
  const entries = await getLeaderboardAction();
  const podium = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <div className="grid gap-4">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <Trophy className="size-5 text-warning" />
        Leaderboard
      </h1>

      {podium.length > 0 && (
        <div className="grid gap-2.5">
          {podium.map((entry) => {
            const style = PODIUM_STYLE[entry.rank];
            return (
              <Link
                key={entry.profile.id}
                href={`/profile/${entry.profile.username}`}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card p-4 transition-transform duration-200 hover:-translate-y-0.5",
                  style.card,
                )}
              >
                <span
                  className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-[0_2px_8px_#0000004d]", style.rank)}
                  style={{ background: style.medallion, color: "#18181b" }}
                >
                  {entry.rank}
                </span>
                <Avatar className="size-11">
                  <AvatarImage src={entry.profile.avatarUrl ?? undefined} alt={entry.profile.fullName} />
                  <AvatarFallback>{initials(entry.profile.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.profile.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{entry.profile.username}</p>
                </div>
                <Badge variant="outline">Level {entry.level}</Badge>
                <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
                  <Coins className="size-3.5 text-warning" />
                  {entry.skillCoins.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid gap-2">
          {rest.map((entry) => (
            <Link
              key={entry.profile.id}
              href={`/profile/${entry.profile.username}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-accent/40"
            >
              <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{entry.rank}</span>
              <Avatar className="size-10">
                <AvatarImage src={entry.profile.avatarUrl ?? undefined} alt={entry.profile.fullName} />
                <AvatarFallback>{initials(entry.profile.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{entry.profile.fullName}</p>
                <p className="text-xs text-muted-foreground">@{entry.profile.username}</p>
              </div>
              <Badge variant="outline">Level {entry.level}</Badge>
              <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
                <Coins className="size-3.5 text-warning" />
                {entry.skillCoins.toLocaleString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
