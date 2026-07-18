import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@skilltego/ui";

export const metadata: Metadata = { title: "Features" };

const FEATURES = [
  {
    title: "Skill-first profiles",
    description:
      "List what you can actually do — with proficiency levels, categories, and proof of work — instead of a static résumé.",
  },
  {
    title: "Discovery, not just search",
    description: "Companies, colleges, and mentors find you by skill and category, not just by job title or degree.",
  },
  {
    title: "Follow & build your network",
    description: "Follow people whose work you admire and build a following around what you create.",
  },
  {
    title: "Company & college dashboards",
    description: "Organizations get dedicated tools to search talent, post opportunities, and manage outreach.",
  },
  {
    title: "Mentor matching",
    description: "Mentors offer guidance and sessions directly to the people who need it, based on shared skills.",
  },
  {
    title: "Privacy by design",
    description: "You control what's visible on your profile, and every account is protected by Supabase-backed auth and row-level security.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <h1 className="text-4xl font-bold">Features</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Everything Skilltego gives you to turn a skill into an opportunity.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle className="text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
