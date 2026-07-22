import type { Metadata } from "next";
import { getMyDraftsAction } from "@/features/posts/actions";
import { DraftsList } from "@/features/posts/components/drafts-list";

export const metadata: Metadata = { title: "Drafts" };

export default async function DraftsPage() {
  const drafts = await getMyDraftsAction();

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Drafts</h1>
      <DraftsList drafts={drafts} />
    </div>
  );
}
