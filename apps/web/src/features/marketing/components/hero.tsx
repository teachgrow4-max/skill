import Link from "next/link";
import { Button } from "@skilltego/ui";
import { FadeIn } from "./fade-in";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-24 sm:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,color-mix(in_oklch,var(--color-primary)_22%,transparent),transparent_40%),radial-gradient(circle_at_85%_25%,color-mix(in_oklch,var(--color-secondary)_20%,transparent),transparent_40%)]"
      />

      <div className="mx-auto max-w-4xl text-center">
        <FadeIn>
          <span className="glass inline-flex rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
            India&apos;s Skill Discovery Platform
          </span>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Every person has a skill.
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Every skill deserves an opportunity.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Upload what you can do. Get discovered by companies, mentors, and colleges — whether you code,
            dance, coach, design, teach, or build. No résumé required to get started.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
