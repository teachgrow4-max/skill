import { Heart, MessageCircle, Image as ImageIcon, UserCheck, UserPlus } from "lucide-react";

interface ProfileStatsBarProps {
  postCount: number;
  followerCount: number;
  followingCount: number;
  totalLikes: number;
  totalComments: number;
}

export function ProfileStatsBar({
  postCount,
  followerCount,
  followingCount,
  totalLikes,
  totalComments,
}: ProfileStatsBarProps) {
  const stats = [
    { label: "Posts", value: postCount, icon: ImageIcon },
    { label: "Followers", value: followerCount, icon: UserCheck },
    { label: "Following", value: followingCount, icon: UserPlus },
    { label: "Likes", value: totalLikes, icon: Heart },
    { label: "Comments", value: totalComments, icon: MessageCircle },
  ];

  return (
    <div className="mt-6 grid grid-cols-5 gap-1 rounded-2xl border border-border bg-card p-2 shadow-sm sm:gap-2 sm:p-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/50"
        >
          <span className="gradient-premium flex size-8 items-center justify-center rounded-full text-premium-foreground sm:size-9">
            <stat.icon className="size-4" />
          </span>
          <span className="text-base font-bold tabular-nums sm:text-lg">{stat.value.toLocaleString()}</span>
          <span className="text-[11px] text-muted-foreground sm:text-xs">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
