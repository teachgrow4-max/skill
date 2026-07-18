import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@skilltego/ui";
import { Check } from "lucide-react";

export const metadata: Metadata = { title: "Pricing" };

const INCLUDED = [
  "Unlimited skill profile with skills, education, and experience",
  "Discovery by companies, colleges, and mentors",
  "Follow other members and build your network",
  "Company and college dashboards",
  "Mentor matching and sessions",
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold">Simple pricing: free.</h1>
      <p className="mt-3 text-muted-foreground">
        Skilltego is free for individuals, mentors, companies, and colleges. No hidden tiers, no credit card.
      </p>

      <Card className="mt-10 text-left">
        <CardHeader>
          <CardTitle className="text-2xl">₹0 / forever</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {INCLUDED.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{item}</span>
            </div>
          ))}
          <Button asChild className="mt-4">
            <Link href="/signup">Get started free</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
