import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@skilltego/config";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to sign up
      </Link>

      <h1 className="mt-6 text-4xl font-bold">{siteConfig.name} Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective Date: July 2026</p>

      <div className="mt-10 grid gap-8 leading-relaxed text-muted-foreground">
        <Section title="1. What data we collect">
          <p>
            When you create a {siteConfig.name} account, we collect the information you provide directly: your
            name, email address, date of birth, username, and any profile details you choose to add — bio,
            skills, education, experience, resume, portfolio, location, and social links. If you sign in with
            Google or GitHub, we receive your name, email, and avatar from that provider. We also collect the
            photos, videos, reels, stories, and messages you post or send, and technical data such as device
            information, IP address, login history, and general usage analytics.
          </p>
        </Section>

        <Section title="2. Why we collect it">
          <p>
            We use your information to create and manage your account, display your profile, make it
            discoverable to other members, companies, colleges, and mentors (subject to the visibility you
            choose), recommend jobs, internships, mentors, and opportunities, personalize your experience,
            improve security, detect fraud and abuse, send important notifications, and improve{" "}
            {siteConfig.name}&apos;s services. We do not sell your personal data.
          </p>
        </Section>

        <Section title="3. Who can see your profile">
          <p>
            Your profile — including your name, username, bio, skills, and public activity — is visible to
            other {siteConfig.name} members and, where relevant, to companies and colleges using the platform
            to discover talent. You control what optional fields you fill in, and can make your account
            private from your settings.
          </p>
        </Section>

        <Section title="4. How your data is stored and protected">
          <p>
            Your data is stored with Supabase (PostgreSQL) under row-level security, meaning only you can
            modify your own profile data at the database level. Authentication is handled by Supabase Auth. We
            use industry-standard encryption in transit (HTTPS) and follow the principle of least privilege
            for any service accessing your data. No online platform can guarantee absolute security, but we
            take reasonable, ongoing steps to protect your information.
          </p>
        </Section>

        <Section title="5. When we share your data">
          <p>
            We do not share your personal data with third parties for their own marketing purposes. We only
            share data when necessary to operate {siteConfig.name}, specifically:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>With service providers who process data on our behalf (see below)</li>
            <li>To comply with a legal obligation, court order, or valid government request</li>
            <li>To investigate fraud, abuse, or violations of our Terms of Service</li>
            <li>To protect the rights, safety, or property of {siteConfig.name}, our users, or the public</li>
          </ul>
          <p className="mt-2">
            We rely on a small set of service providers to operate {siteConfig.name}: Supabase (database and
            authentication), Cloudinary (image storage), Vercel (hosting), and Resend (transactional email).
            Each processes only the data necessary to provide their service to us.
          </p>
        </Section>

        <Section title="6. Cookies and analytics">
          <p>
            We use essential cookies to keep you signed in and remember your preferences, and lightweight
            product analytics to understand how {siteConfig.name} is used so we can improve it. We do not use
            third-party advertising cookies or trackers.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>
            You can view, update, or delete your profile information at any time from your account settings.
            You may request a copy of your data or full account deletion by contacting us using the details
            below.
          </p>
        </Section>

        <Section title="8. Age requirement">
          <p>
            {siteConfig.name} is open to users aged {siteConfig.minAge} and older. We do not knowingly collect
            data from children under {siteConfig.minAge}. If we learn that a user under {siteConfig.minAge}{" "}
            has created an account, we will remove it.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            {siteConfig.legalEntity} may update this policy as {siteConfig.name} evolves. Material changes
            will be communicated via email or an in-app notice before they take effect.
          </p>
        </Section>

        <Section title="10. Contact us">
          <p>
            For privacy-related questions or requests, contact:
            <br />
            {siteConfig.legalEntity}
            <br />
            Email:{" "}
            <a href={`mailto:${siteConfig.legalEmail}`} className="text-primary hover:underline">
              {siteConfig.legalEmail}
            </a>
          </p>
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
