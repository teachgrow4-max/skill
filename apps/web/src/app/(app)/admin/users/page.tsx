import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminStatsAction, getAdminUsersAction } from "@/features/admin/actions";
import { UsersPanel } from "@/features/admin/components/users-panel";
import { AdminNav } from "@/features/admin/components/admin-nav";

export const metadata: Metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  const stats = await getAdminStatsAction();
  if (!stats) notFound();

  const users = await getAdminUsersAction("");

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Users</h1>
        <AdminNav />
      </div>
      <UsersPanel initialUsers={users} />
    </div>
  );
}
