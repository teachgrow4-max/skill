import type { Metadata } from "next";
import { getMyPendingFollowRequestsAction } from "@/features/profile/social-actions";
import { FollowRequestsList } from "@/features/profile/components/follow-requests-list";

export const metadata: Metadata = { title: "Follow requests" };

export default async function FollowRequestsPage() {
  const requests = await getMyPendingFollowRequestsAction();

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Follow requests</h1>
      <FollowRequestsList initialRequests={requests} />
    </div>
  );
}
