import Link from "next/link";
import { Briefcase, Calendar, MapPin, Trophy, GraduationCap, Users } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@skilltego/ui";
import { formatRelativeTime } from "@skilltego/utils";
import type { Opportunity } from "@skilltego/types";
import { KIND_LABELS } from "../schema";

const KIND_ICONS = {
  job: Briefcase,
  internship: Briefcase,
  competition: Trophy,
  event: Calendar,
  scholarship: GraduationCap,
} as const;

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const Icon = KIND_ICONS[opportunity.kind];

  return (
    <Link href={`/opportunities/${opportunity.id}`}>
      <Card className="h-full transition-transform hover:-translate-y-0.5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="flex w-fit items-center gap-1">
              <Icon className="size-3" />
              {KIND_LABELS[opportunity.kind]}
            </Badge>
            {opportunity.status === "closed" && <Badge variant="outline">Closed</Badge>}
          </div>
          <CardTitle className="text-base">{opportunity.title}</CardTitle>
          <p className="text-xs text-muted-foreground">{opportunity.author.fullName}</p>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">{opportunity.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {(opportunity.location || opportunity.isRemote) && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {opportunity.isRemote ? "Remote" : opportunity.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {opportunity.applicationCount}
            </span>
            <span>{formatRelativeTime(opportunity.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
