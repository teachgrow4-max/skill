import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@skilltego/config";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to sign up
      </Link>

      <h1 className="mt-6 text-4xl font-bold">{siteConfig.name} Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Effective Date: July 2026</p>

      <div className="mt-10 grid gap-8 leading-relaxed text-muted-foreground">
        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account or using {siteConfig.name}, you confirm that you are at least{" "}
            {siteConfig.minAge} years old and agree to these Terms of Service and the Privacy Policy.
          </p>
        </Section>

        <Section title="2. Permissions Required">
          <p>{siteConfig.name} may request permission to access:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Camera</li>
            <li>Photo Gallery / Storage</li>
            <li>Microphone</li>
            <li>Location</li>
            <li>Contacts (optional, only if you choose to find or invite friends)</li>
            <li>Notifications</li>
            <li>Device Information</li>
            <li>Internet Connection</li>
          </ul>
          <p className="mt-2">
            You may deny optional permissions, but some features may not function correctly.
          </p>
        </Section>

        <Section title="3. Information We Collect">
          <p>We may collect:</p>
          <ul className="mt-2 grid list-disc gap-1 pl-5 sm:grid-cols-2">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Username</li>
            <li>Profile photo</li>
            <li>Cover image</li>
            <li>Resume</li>
            <li>Portfolio</li>
            <li>Skills</li>
            <li>Education</li>
            <li>Work experience</li>
            <li>Photos</li>
            <li>Videos</li>
            <li>Reels</li>
            <li>Stories</li>
            <li>Messages</li>
            <li>Device information</li>
            <li>IP address</li>
            <li>Login history</li>
            <li>Usage analytics</li>
            <li>Location (if permission is granted)</li>
          </ul>
        </Section>

        <Section title="4. How We Use Your Information">
          <p>Your information is used to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Create and manage your account</li>
            <li>Display your profile</li>
            <li>Recommend jobs, internships, mentors, and opportunities</li>
            <li>Personalize your experience</li>
            <li>Improve security</li>
            <li>Detect fraud and abuse</li>
            <li>Send important notifications</li>
            <li>Improve {siteConfig.name} services</li>
          </ul>
        </Section>

        <Section title="5. Data Access">
          <p>
            {siteConfig.legalEntity}, the owner and operator of {siteConfig.name}, may access, process, store,
            and manage user data only for legitimate operational purposes, including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Platform functionality</li>
            <li>Customer support</li>
            <li>Security</li>
            <li>Moderation</li>
            <li>Analytics</li>
            <li>Legal compliance</li>
            <li>Service improvements</li>
          </ul>
        </Section>

        <Section title="6. User Responsibilities">
          <p>Users must not:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Upload illegal content</li>
            <li>Upload abusive or harmful content</li>
            <li>Impersonate others</li>
            <li>Share misleading information</li>
            <li>Infringe intellectual property rights</li>
            <li>Attempt unauthorized access or hacking</li>
            <li>Use automated bots without permission</li>
          </ul>
          <p className="mt-2">Violations may result in account suspension or permanent termination.</p>
        </Section>

        <Section title="7. Content Ownership">
          <p>
            You retain ownership of the content you upload. By uploading content, you grant {siteConfig.name}{" "}
            and {siteConfig.legalEntity} a non-exclusive, worldwide license to host, process, display, and
            distribute your content solely for operating and improving the platform.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We implement reasonable safeguards to protect your information. However, no online platform can
            guarantee absolute security.
          </p>
        </Section>

        <Section title="9. Account Suspension">
          <p>Accounts may be suspended or permanently terminated for:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Fraud</li>
            <li>Fake profiles</li>
            <li>Spam</li>
            <li>Harassment</li>
            <li>Illegal activities</li>
            <li>Violations of these Terms</li>
          </ul>
        </Section>

        <Section title="10. Updates">
          <p>
            {siteConfig.legalEntity} may update these Terms periodically. Continued use of {siteConfig.name}{" "}
            after updates constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
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
