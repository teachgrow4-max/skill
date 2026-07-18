import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <VerifyEmailPanel email={email ?? null} />;
}
