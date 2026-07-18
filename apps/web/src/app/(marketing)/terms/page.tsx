import type { Metadata } from "next";
import { siteConfig } from "@skilltego/config";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="mt-10 grid gap-8 leading-relaxed text-muted-foreground">
        <Section title="1. Acceptance of terms">
          <p>
            By creating a {siteConfig.name} account, you agree to these Terms of Service and our Privacy
            Policy. If you do not agree, do not use {siteConfig.name}.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 13 years old to use {siteConfig.name}. By signing up, you confirm the age you
            provide is accurate.
          </p>
        </Section>

        <Section title="3. Your account">
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activity under your account. Notify us immediately of any unauthorized use.
          </p>
        </Section>

        <Section title="4. Acceptable use">
          <p>
            You agree not to: impersonate another person or organization; post false, misleading, or
            fraudulent skill claims; upload content that is unlawful, harassing, hateful, sexually explicit,
            or infringes on someone else&apos;s rights; spam other members; attempt to access accounts or data
            that are not yours; or use automated means to scrape or abuse the platform.
          </p>
        </Section>

        <Section title="5. Content ownership">
          <p>
            You retain ownership of the content you post — your profile details, posts, and portfolio items.
            By posting content, you grant {siteConfig.name} a non-exclusive, worldwide license to display and
            distribute it within the platform so your profile can be discovered by others.
          </p>
        </Section>

        <Section title="6. Moderation and enforcement">
          <p>
            We may remove content or suspend accounts that violate these Terms or our Community Guidelines,
            including content flagged by our automated moderation systems or reported by other members.
          </p>
        </Section>

        <Section title="7. Company, college, and mentor accounts">
          <p>
            Organizations using {siteConfig.name} to discover talent, post opportunities, or offer mentorship
            must provide accurate information about themselves and comply with applicable employment and
            education laws when contacting members.
          </p>
        </Section>

        <Section title="8. Termination">
          <p>
            You may delete your account at any time. We may suspend or terminate accounts that violate these
            Terms, with notice where practical.
          </p>
        </Section>

        <Section title="9. Disclaimer and limitation of liability">
          <p>
            {siteConfig.name} is provided &quot;as is&quot; without warranties of any kind. We are not liable
            for indirect, incidental, or consequential damages arising from your use of the platform, to the
            maximum extent permitted by law.
          </p>
        </Section>

        <Section title="10. Changes to these terms">
          <p>
            We may update these Terms from time to time. Continued use of {siteConfig.name} after changes take
            effect constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>Questions about these Terms? Reach us from the Contact page.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 text-sm">{children}</div>
    </section>
  );
}
