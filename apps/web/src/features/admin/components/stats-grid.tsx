import { Card, CardContent, CardHeader, CardTitle } from "@skilltego/ui";
import type { PlatformStats } from "@skilltego/database";

export function StatsGrid({ stats }: { stats: PlatformStats }) {
  const cards = [
    { label: "Total users", value: stats.totalUsers },
    { label: "Total posts", value: stats.totalPosts },
    { label: "Pending reports", value: stats.pendingReports },
    { label: "Pending verifications", value: stats.pendingVerifications },
    { label: "Open opportunities", value: stats.openOpportunities },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardTitle className="text-3xl">{card.value}</CardTitle>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </CardHeader>
        </Card>
      ))}

      <Card className="sm:col-span-2 lg:col-span-5">
        <CardHeader>
          <CardTitle className="text-base">Users by type</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          {Object.entries(stats.usersByType).map(([type, count]) => (
            <span key={type} className="capitalize">
              {type}: <strong>{count}</strong>
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
