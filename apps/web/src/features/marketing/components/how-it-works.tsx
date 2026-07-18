import { UserPlus, Radar, Handshake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@skilltego/ui";
import { FadeIn } from "./fade-in";

const STEPS = [
  {
    icon: UserPlus,
    title: "Build your skill profile",
    description:
      "Add the skills you actually have — technical, creative, athletic, or academic — with your proficiency and proof of work.",
  },
  {
    icon: Radar,
    title: "Get discovered",
    description:
      "Companies, colleges, and mentors search Skilltego by skill, not just by degree or job title. Your profile does the talking.",
  },
  {
    icon: Handshake,
    title: "Unlock opportunities",
    description:
      "Connect with recruiters, mentors, and collaborators who are looking for exactly what you can do.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">How Skilltego works</h2>
        </FadeIn>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <FadeIn key={step.title} delay={i * 0.1}>
              <Card className="h-full">
                <CardHeader>
                  <div className="mb-2 w-fit rounded-full bg-primary/10 p-3">
                    <step.icon className="size-6 text-primary" />
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
