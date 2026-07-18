import type { Metadata } from "next";
import { siteConfig } from "@skilltego/config";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="mt-10 grid gap-8 leading-relaxed text-muted-foreground">
        <Section title="1. What we collect">
          <p>
            When you create a {siteConfig.name} account, we collect the information you provide directly: your
            name, email address, date of birth, username, and any profile details you choose to add — bio,
            skills, education, experience, location, and social links. If you sign in with Google or GitHub,
            we receive your name, email, and avatar from that provider. If you upload a profile photo or cover
            image, it is stored with Cloudinary.
          </p>
        </Section>

        <Section title="2. How we use your information">
          <p>
            We use your information to operate your profile, make it discoverable to other members, companies,
            colleges, and mentors (subject to the visibility you choose), authenticate your account, and
            improve the platform. We do not sell your personal data.
          </p>
        </Section>

        <Section title="3. Who can see your profile">
          <p>
            Your profile — including your name, username, bio, skills, and public activity — is visible to
            other {siteConfig.name} members and, where relevant, to companies and colleges using the platform
            to discover talent. You control what optional fields you fill in.
          </p>
        </Section>

        <Section title="4. Data storage and security">
          <p>
            Your data is stored with Supabase (PostgreSQL) under row-level security, meaning only you can
            modify your own profile data at the database level. Authentication is handled by Supabase Auth. We
            use industry-standard encryption in transit (HTTPS) and follow the principle of least privilege
            for any service accessing your data.
          </p>
        </Section>

        <Section title="5. Age requirement">
          <p>
            {siteConfig.name} is open to users aged 13 and older. We do not knowingly collect data from
            children under 13. If we learn that a user under 13 has created an account, we will remove it.
          </p>
        </Section>

        <Section title="6. Your rights">
          <p>
            You can access, edit, or delete your profile information at any time from your account settings.
            You may request a copy of your data or full account deletion by contacting us — see the Contact
            page.
          </p>
        </Section>

        <Section title="7. Third-party services">
          <p>
            We rely on a small set of service providers to operate {siteConfig.name}: Supabase (database and
            authentication), Cloudinary (image storage), Vercel (hosting), and Resend (transactional email).
            Each processes only the data necessary to provide their service to us.
          </p>
        </Section>

        <Section title="8. Changes to this policy">
          <p>
            We may update this policy as {siteConfig.name} evolves. Material changes will be communicated via
            email or an in-app notice before they take effect.
          </p>
        </Section>

        <Section title="9. Contact us">
          <p>Questions about this policy? Reach us from the Contact page.</p>
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
