import type { AuthorSummary, Opportunity, OpportunityApplication, OpportunityApplicationRow, OpportunityRow } from "@skilltego/types";

export function toOpportunity(
  row: OpportunityRow,
  author: AuthorSummary,
  flags: { applicationCount: number; hasApplied: boolean },
): Opportunity {
  return {
    id: row.id,
    author,
    kind: row.kind,
    title: row.title,
    description: row.description,
    skillCategory: row.skill_category,
    requiredSkills: row.required_skills,
    location: row.location,
    isRemote: row.is_remote,
    compensation: row.compensation,
    deadline: row.deadline,
    eventDate: row.event_date,
    status: row.status,
    applicationCount: flags.applicationCount,
    hasApplied: flags.hasApplied,
    createdAt: row.created_at,
  };
}

export function toOpportunityApplication(
  row: OpportunityApplicationRow,
  applicant: AuthorSummary,
  resumeUrl: string | null,
): OpportunityApplication {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    applicant,
    status: row.status,
    coverNote: row.cover_note,
    resumeUrl,
    createdAt: row.created_at,
  };
}
