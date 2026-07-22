import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@skilltego/ui";
import { cn, initials } from "@skilltego/utils";
import { getLeaderboardAction } from "@/features/gamification/actions";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const entries = await getLeaderboardAction();

  return (
    <div className="grid gap-4">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <Trophy className="size-5 text-warning" />
        Leaderboard
      </h1>

      <div className="grid gap-2">
        {entries.map((entry) => (
          <Link
            key={entry.profile.id}
            href={`/profile/${entry.profile.username}`}
            className="glass flex items-center gap-3 rounded-xl p-3 hover:bg-accent/40"
          >
            <span
              className={cn(
                "w-6 text-center text-sm font-semibold",
                entry.rank === 1 && "text-warning",
                entry.rank === 2 && "text-muted-foreground",
                entry.rank === 3 && "text-secondary",
              )}
            >
              {entry.rank}
            </span>
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
    </div>
  );
}
