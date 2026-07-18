import type { Metadata } from "next";
import { siteConfig } from "@skilltego/config";

export const metadata: Metadata = { title: "Community Guidelines" };

const GUIDELINES = [
  {
    title: "Be honest about your skills",
    body: "List skills you actually have. Misrepresenting your abilities undermines the trust companies, colleges, and mentors place in the platform.",
  },
  {
    title: "Respect everyone",
    body: `${siteConfig.name} welcomes people aged 13 and up from every background. Harassment, hate speech, and bullying are not tolerated.`,
  },
  {
    title: "No spam or scams",
    body: "Don't post repetitive content, unsolicited promotions, phishing links, or attempt to collect personal information from other members.",
  },
  {
    title: "Keep content appropriate",
    body: "No sexually explicit, violent, or otherwise unsafe content — Skilltego is used by people as young as 13.",
  },
  {
    title: "Protect others' privacy",
    body: "Don't share someone else's personal information (phone numbers, addresses, private messages) without their consent.",
  },
  {
    title: "Original work",
    body: "Only post portfolio items and projects that are your own, or that you have the rights to share.",
  },
  {
    title: "Report, don't retaliate",
    body: "If you see content or behavior that violates these guidelines, report it. Our moderation team reviews reports and takes action.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-bold">Community Guidelines</h1>
      <p className="mt-3 text-muted-foreground">
        These guidelines keep {siteConfig.name} a trustworthy place to showcase real skills. Violations may result
        in content removal, warnings, or account suspension.
      </p>

      <div className="mt-10 grid gap-8">
        {GUIDELINES.map((item) => (
          <div key={item.title}>
            <h2 className="font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
