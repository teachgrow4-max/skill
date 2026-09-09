import Link from "next/link";

interface ProfileStatsBarProps {
  username: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export function ProfileStatsBar({ username, postCount, followerCount, followingCount }: ProfileStatsBarProps) {
  const stats = [
    { label: "Posts", value: postCount, href: "#profile-tabs" },
    { label: "Followers", value: followerCount, href: `/profile/${username}/followers` },
    { label: "Following", value: followingCount, href: `/profile/${username}/following` },
  ];

  return (
    <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/50"
        >
          <span className="text-xl font-bold tabular-nums sm:text-2xl">{stat.value.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground sm:text-sm">{stat.label}</span>
        </Link>
      ))}
    </div>
  );
}
