import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Button } from "@skilltego/ui";
import { siteConfig } from "@skilltego/config";

export const metadata: Metadata = { title: "Contact" };

const CONTACT_EMAIL = "hello@skilltego.com";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold">Get in touch</h1>
      <p className="mt-3 text-muted-foreground">
        Questions, feedback, or partnership ideas for {siteConfig.name}? We&apos;d love to hear from you.
      </p>

      <Button asChild size="lg" className="mt-8">
        <a href={`mailto:${CONTACT_EMAIL}`}>
          <Mail className="size-4" />
          {CONTACT_EMAIL}
        </a>
      </Button>
    </div>
  );
}
