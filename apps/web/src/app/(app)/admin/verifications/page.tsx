import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminStatsAction, getAdminVerificationRequestsAction } from "@/features/admin/actions";
import { VerificationsPanel } from "@/features/admin/components/verifications-panel";
import { AdminNav } from "@/features/admin/components/admin-nav";

export const metadata: Metadata = { title: "Admin — Verifications" };

export default async function AdminVerificationsPage() {
  const stats = await getAdminStatsAction();
  if (!stats) notFound();

  const requests = await getAdminVerificationRequestsAction();

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Verification requests</h1>
        <AdminNav />
      </div>
      <VerificationsPanel initialRequests={requests} />
    </div>
  );
}
