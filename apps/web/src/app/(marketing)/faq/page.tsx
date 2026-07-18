import type { Metadata } from "next";
import { siteConfig } from "@skilltego/config";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    question: "Who can join Skilltego?",
    answer: "Anyone aged 13 or older — students, professionals, artists, athletes, teachers, creators, entrepreneurs, freelancers, recruiters, companies, and colleges.",
  },
  {
    question: "Is Skilltego free?",
    answer: "Yes. Skilltego is free for everyone — individuals, mentors, companies, and colleges.",
  },
  {
    question: "How is Skilltego different from a job board or LinkedIn?",
    answer: "Skilltego is organized around skills, not job titles or degrees. You build a skill profile, and companies, colleges, and mentors discover you by what you can do.",
  },
  {
    question: "How do I sign up?",
    answer: "Create an account with email, Google, or GitHub, then build your profile by adding your skills, bio, and location.",
  },
  {
    question: "Can I change my username later?",
    answer: "Yes, from your profile edit page, as long as the new username is available.",
  },
  {
    question: "How do companies and colleges find talent?",
    answer: "Through skill-based search and category browsing, plus dedicated dashboards for posting opportunities.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-bold">Frequently asked questions</h1>
      <p className="mt-3 text-muted-foreground">Everything you need to know about {siteConfig.name}.</p>

      <div className="mt-10 grid gap-8">
        {FAQS.map((faq) => (
          <div key={faq.question}>
            <h2 className="font-semibold">{faq.question}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
