import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@skilltego/config";

export const metadata: Metadata = { title: "Delete Your Account" };

export default function DeleteAccountInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="size-4" />
        Back to log in
      </Link>

      <h1 className="mt-6 text-4xl font-bold">Delete Your {siteConfig.name} Account</h1>

      <div className="mt-10 grid gap-8 leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">How to request deletion</h2>
          <div className="mt-2 grid gap-2 text-sm">
            <ol className="list-decimal space-y-1 pl-5">
              <li>Log in to your {siteConfig.name} account.</li>
              <li>
                Go to <span className="font-medium text-foreground">Settings → Delete Account</span>.
              </li>
              <li>Type your username to confirm and select &ldquo;Permanently delete my account.&rdquo;</li>
            </ol>
            <p>
              Deletion happens immediately when you confirm — there is no waiting period. If you can&apos;t log
              in (lost access, forgotten password, or you&apos;ve already uninstalled the app), email us at{" "}
              <a href={`mailto:${siteConfig.legalEmail}`} className="text-primary hover:underline">
                {siteConfig.legalEmail}
              </a>{" "}
              from the address on your account and we&apos;ll delete it for you.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">What gets deleted</h2>
          <p className="mt-2 text-sm">
            Your account, profile (name, bio, skills, resume, social links), posts, stories, reels, comments,
            messages, follows/followers, saved posts, notifications, and Skill Coins balance are all permanently
            removed. This cannot be undone.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Retention</h2>
          <p className="mt-2 text-sm">
            We don&apos;t retain a copy of your data after deletion, except where we&apos;re legally required to (for
            example, records needed to comply with a legal obligation or investigate abuse already reported
            before your account was deleted).
          </p>
        </section>
      </div>
    </div>
  );
}
