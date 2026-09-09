import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { getFollowerCount, getFollowingCount, getProfileByUsername } from "@skilltego/database";
import { EmptyState } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { getFollowStateAction } from "@/features/profile/social-actions";
import { FollowList } from "./follow-list";

interface ProfileFollowListPageProps {
  username: string;
  mode: "followers" | "following";
}

export async function ProfileFollowListPage({ username, mode }: ProfileFollowListPageProps) {
  const supabase = await createClient();
  const profileRow = await getProfileByUsername(supabase, username);
  if (!profileRow) notFound();

  const user = await getCurrentUser();
  const isOwnProfile = user?.id === profileRow.id;
  const viewerFollowState = user ? await getFollowStateAction(profileRow.id) : "none";
  const canView = isOwnProfile || !profileRow.is_private || viewerFollowState === "following";

  const count =
    mode === "followers"
      ? await getFollowerCount(supabase, profileRow.id)
      : await getFollowingCount(supabase, profileRow.id);

  const title = mode === "followers" ? "Followers" : "Following";
  const emptyTitle = mode === "followers" ? "No followers yet" : "You're not following anyone yet";
  const emptyDescription =
    mode === "followers"
      ? isOwnProfile
        ? "When people follow you, they'll show up here."
        : `When people follow @${profileRow.username}, they'll show up here.`
      : isOwnProfile
        ? "Accounts you follow will show up here."
        : `Accounts @${profileRow.username} follows will show up here.`;

  return (
    <div className="mx-auto max-w-lg">
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link
          href={`/profile/${profileRow.username}`}
          aria-label="Back to profile"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-base font-semibold">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {count.toLocaleString()} {mode === "followers" ? "followers" : "following"}
          </p>
        </div>
      </div>

      <div className="pt-4">
        {canView ? (
          <FollowList
            mode={mode}
            profileId={profileRow.id}
            currentUserId={user?.id ?? null}
            isOwnProfile={isOwnProfile}
            isLoggedIn={Boolean(user)}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        ) : (
          <EmptyState
            icon={<Lock className="size-6" />}
            title="This account is private"
            description={`Follow @${profileRow.username} to see their ${mode}.`}
          />
        )}
      </div>
    </div>
  );
}
