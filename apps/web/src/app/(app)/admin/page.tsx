import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminStatsAction } from "@/features/admin/actions";
import { StatsGrid } from "@/features/admin/components/stats-grid";
import { AdminNav } from "@/features/admin/components/admin-nav";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStatsAction();
  if (!stats) notFound();

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin dashboard</h1>
        <AdminNav />
      </div>
      <StatsGrid stats={stats} />
    </div>
  );
}
