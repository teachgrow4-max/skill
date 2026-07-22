import { Heart, MessageCircle, Image as ImageIcon, UserCheck, UserPlus } from "lucide-react";
import { cn } from "@skilltego/utils";

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
    { label: "Posts", value: postCount, icon: ImageIcon, color: "text-primary", bg: "bg-primary/10" },
    { label: "Followers", value: followerCount, icon: UserCheck, color: "text-violet-500", bg: "bg-violet-500/10" },
    {
      label: "Following",
      value: followingCount,
      icon: UserPlus,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    { label: "Likes", value: totalLikes, icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Comments", value: totalComments, icon: MessageCircle, color: "text-sky-500", bg: "bg-sky-500/10" },
  ];

  return (
    <div className="glass mt-6 grid grid-cols-5 gap-1 rounded-2xl p-2 shadow-sm sm:gap-2 sm:p-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/50"
        >
          <span className={cn("flex size-8 items-center justify-center rounded-full sm:size-9", stat.bg)}>
            <stat.icon className={cn("size-4", stat.color)} />
          </span>
          <span className="text-base font-bold tabular-nums sm:text-lg">{stat.value.toLocaleString()}</span>
          <span className="text-[11px] text-muted-foreground sm:text-xs">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
