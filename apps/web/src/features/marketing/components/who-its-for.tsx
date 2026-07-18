import {
  GraduationCap,
  Briefcase,
  Palette,
  Trophy,
  BookOpen,
  Sparkles,
  Rocket,
  Users,
  UserSearch,
  Building2,
  School,
} from "lucide-react";
import { Card } from "@skilltego/ui";
import { FadeIn } from "./fade-in";

const AUDIENCE = [
  { label: "Students", icon: GraduationCap },
  { label: "Professionals", icon: Briefcase },
  { label: "Artists", icon: Palette },
  { label: "Athletes", icon: Trophy },
  { label: "Teachers", icon: BookOpen },
  { label: "Creators", icon: Sparkles },
  { label: "Entrepreneurs", icon: Rocket },
  { label: "Freelancers", icon: Users },
  { label: "Recruiters", icon: UserSearch },
  { label: "Companies", icon: Building2 },
  { label: "Colleges", icon: School },
];

export function WhoItsFor() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Built for everyone with a skill</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Skilltego is for anyone 13 and up who wants to be seen for what they can actually do.
          </p>
        </FadeIn>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {AUDIENCE.map(({ label, icon: Icon }, i) => (
            <FadeIn key={label} delay={i * 0.03}>
              <Card className="flex flex-col items-center gap-3 p-6 text-center transition-transform hover:-translate-y-1">
                <div className="rounded-full bg-primary/10 p-3">
                  <Icon className="size-6 text-primary" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
