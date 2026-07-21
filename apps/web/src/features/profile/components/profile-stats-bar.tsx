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
    { label: "Posts", value: postCount },
    { label: "Followers", value: followerCount },
    { label: "Following", value: followingCount },
    { label: "Likes", value: totalLikes },
    { label: "Comments", value: totalComments },
  ];

  return (
    <div className="flex flex-wrap gap-6 border-y border-border py-4">
      {stats.map((stat) => (
        <div key={stat.label}>
          <div className="text-lg font-bold">{stat.value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
