import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getModerationQueueAction } from "@/features/reports/actions";
import { ModerationQueue } from "@/features/reports/components/moderation-queue";

export const metadata: Metadata = { title: "Moderation queue" };

export default async function ModerationPage() {
  const { isModerator, reports } = await getModerationQueueAction();
  if (!isModerator) notFound();

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Moderation queue</h1>
      <ModerationQueue initialReports={reports} />
    </div>
  );
}
