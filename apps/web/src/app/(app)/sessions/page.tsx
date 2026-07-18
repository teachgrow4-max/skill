import type { Metadata } from "next";
import { getMySessionsAction } from "@/features/mentorship/actions";
import { SessionsList } from "@/features/mentorship/components/sessions-list";

export const metadata: Metadata = { title: "My sessions" };

export default async function SessionsPage() {
  const sessions = await getMySessionsAction("student");

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">My mentor sessions</h1>
      <SessionsList sessions={sessions} role="student" />
    </div>
  );
}
