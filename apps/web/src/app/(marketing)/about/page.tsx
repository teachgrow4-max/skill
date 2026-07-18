import type { Metadata } from "next";
import { siteConfig } from "@skilltego/config";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-bold">About {siteConfig.name}</h1>
      <div className="mt-8 grid gap-6 leading-relaxed text-muted-foreground">
        <p>
          Most platforms judge people by their résumé, their degree, or their job title. {siteConfig.name} was
          built on a simpler idea: <strong className="text-foreground">every person has a skill, and every skill
          deserves an opportunity.</strong>
        </p>
        <p>
          We built {siteConfig.name} for the student who codes better than they test, the athlete whose training
          hours never show up on a transcript, the self-taught designer without a portfolio site, and the teacher
          whose classroom impact never makes it onto LinkedIn. Whatever you can do — technical, creative,
          athletic, or academic — {siteConfig.name} gives it a place to be seen.
        </p>
        <p>
          Companies, colleges, and mentors use {siteConfig.name} to search by skill instead of pedigree, so the
          people who can actually do the work get found by the people looking for it.
        </p>
        <p>{siteConfig.name} is open to anyone aged 13 and up — students, professionals, artists, athletes,
          teachers, creators, entrepreneurs, freelancers, recruiters, companies, and colleges alike.</p>
      </div>
    </div>
  );
}
