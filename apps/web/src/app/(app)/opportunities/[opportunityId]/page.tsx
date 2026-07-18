import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@skilltego/ui";
import { initials, formatRelativeTime } from "@skilltego/utils";
import { createClient } from "@/lib/supabase/server";
import { getOpportunityAction } from "@/features/opportunities/actions";
import { KIND_LABELS } from "@/features/opportunities/schema";
import { ApplyButton } from "@/features/opportunities/components/apply-button";

interface OpportunityPageProps {
  params: Promise<{ opportunityId: string }>;
}

export async function generateMetadata({ params }: OpportunityPageProps): Promise<Metadata> {
  const { opportunityId } = await params;
  const opportunity = await getOpportunityAction(opportunityId);
  return { title: opportunity?.title ?? "Opportunity not found" };
}

const ACTION_LABELS: Record<string, string> = {
  job: "Apply",
  internship: "Apply",
  competition: "Register",
  event: "RSVP",
  scholarship: "Apply",
};

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const { opportunityId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const opportunity = await getOpportunityAction(opportunityId);
  if (!opportunity) notFound();

  return (
    <div className="glass grid gap-4 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{KIND_LABELS[opportunity.kind]}</Badge>
        {opportunity.status === "closed" && <Badge variant="outline">Closed</Badge>}
      </div>

      <h1 className="text-2xl font-bold">{opportunity.title}</h1>

      <Link href={`/profile/${opportunity.author.username}`} className="flex items-center gap-2">
        <Avatar className="size-8">
          <AvatarImage src={opportunity.author.avatarUrl ?? undefined} alt={opportunity.author.fullName} />
          <AvatarFallback className="text-xs">{initials(opportunity.author.fullName)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium hover:underline">{opportunity.author.fullName}</span>
      </Link>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {(opportunity.location || opportunity.isRemote) && (
          <span className="flex items-center gap-1">
            <MapPin className="size-4" />
            {opportunity.isRemote ? "Remote" : opportunity.location}
          </span>
        )}
        {opportunity.deadline && (
          <span className="flex items-center gap-1">
            <Calendar className="size-4" />
            Deadline {new Date(opportunity.deadline).toLocaleDateString()}
          </span>
        )}
        {opportunity.eventDate && (
          <span className="flex items-center gap-1">
            <Calendar className="size-4" />
            {new Date(opportunity.eventDate).toLocaleDateString()}
          </span>
        )}
        {opportunity.compensation && <span>{opportunity.compensation}</span>}
      </div>

      <p className="whitespace-pre-line text-sm leading-relaxed">{opportunity.description}</p>

      {opportunity.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {opportunity.requiredSkills.map((skill) => (
            <Badge key={skill} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {opportunity.applicationCount}{" "}
        {opportunity.kind === "event" || opportunity.kind === "competition" ? "registered" : "applied"} ·
        Posted {formatRelativeTime(opportunity.createdAt)}
      </p>

      <ApplyButton
        opportunityId={opportunity.id}
        isLoggedIn={Boolean(user)}
        hasApplied={opportunity.hasApplied}
        isOwner={user?.id === opportunity.author.id}
        isClosed={opportunity.status === "closed"}
        actionLabel={ACTION_LABELS[opportunity.kind]}
      />
    </div>
  );
}
