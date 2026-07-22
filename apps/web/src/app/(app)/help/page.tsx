import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, HelpCircle, Mail } from "lucide-react";

export const metadata: Metadata = { title: "Help & Support" };

export default function HelpPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">Help & Support</h1>
      <p className="text-sm text-muted-foreground">
        Need a hand? Check our frequently asked questions or reach out directly — we read every message.
      </p>

      <div className="grid gap-3">
        <Link
          href="/faq"
          className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/40"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Frequently asked questions</p>
              <p className="text-xs text-muted-foreground">Answers to common questions about Skilltego.</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/contact"
          className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/40"
        >
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Contact us</p>
              <p className="text-xs text-muted-foreground">Get in touch with the Skilltego team.</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
