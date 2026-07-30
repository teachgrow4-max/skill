import { Briefcase, FileText, Flag, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@skilltego/ui";
import type { PlatformStats } from "@skilltego/database";

export function StatsGrid({ stats }: { stats: PlatformStats }) {
  const cards = [
    { label: "Total users", value: stats.totalUsers, icon: Users },
    { label: "Total posts", value: stats.totalPosts, icon: FileText },
    { label: "Pending reports", value: stats.pendingReports, icon: Flag },
    { label: "Pending verifications", value: stats.pendingVerifications, icon: ShieldCheck },
    { label: "Open opportunities", value: stats.openOpportunities, icon: Briefcase },
  ];

  const usersByType = Object.entries(stats.usersByType);
  const maxUsers = Math.max(1, ...usersByType.map(([, count]) => count));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="transition-transform duration-200 hover:-translate-y-0.5">
          <CardHeader className="gap-3">
            <span
              className="flex size-9 items-center justify-center rounded-full text-[#3f3f46]"
              style={{ background: "radial-gradient(circle at 35% 30%, #f5f5f5, #d9d9d9 55%, #a1a1aa)" }}
            >
              <card.icon className="size-4" />
            </span>
            <div>
              <CardTitle className="text-3xl font-bold tabular-nums">{card.value.toLocaleString()}</CardTitle>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </CardHeader>
        </Card>
      ))}

      <Card className="sm:col-span-2 lg:col-span-5">
        <CardHeader>
          <CardTitle className="text-base">Users by type</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {usersByType.map(([type, count]) => (
            <div key={type} className="grid gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="capitalize text-muted-foreground">{type}</span>
                <span className="font-semibold tabular-nums">{count.toLocaleString()}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(count / maxUsers) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
