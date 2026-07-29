import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock, Rocket } from "lucide-react";
import {
  getFollowerCount,
  getFollowingCount,
  getProfileByUsername,
  getProfileEngagementTotals,
  getProfileSkills,
  getPublishedPostCount,
  toProfile,
} from "@skilltego/database";
import { EmptyState } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/server";
import { getProfilePostsAction, getBookmarkedPostsAction } from "@/features/posts/actions";
import { getFollowStateAction } from "@/features/profile/social-actions";
import { getMentorAvailabilityAction, getMentorReviewsAction } from "@/features/mentorship/actions";
import { BookingWidget } from "@/features/mentorship/components/booking-widget";
import { MentorReviews } from "@/features/mentorship/components/mentor-reviews";
import { getMyBadgesAction, getSkillCoinSummaryAction } from "@/features/gamification/actions";
import { BadgeList } from "@/features/gamification/components/badge-list";
import { SkillCoinsSummaryCard } from "@/features/gamification/components/skill-coins-summary-card";
import { CreateFirstPostButton } from "@/features/posts/components/create-first-post-button";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileStatsBar } from "@/features/profile/components/profile-stats-bar";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";
import { PostGrid } from "@/features/profile/components/post-grid";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  student: "Student",
  professional: "Professional",
  mentor: "Mentor",
  company: "Company",
  college: "College",
  admin: "Admin",
  moderator: "Moderator",
};

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const profileRow = await getProfileByUsername(supabase, username);

  if (!profileRow) return { title: "Profile not found" };

  return {
    title: profileRow.full_name,
    description: profileRow.bio ?? `${profileRow.full_name}'s Skilltego profile`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const profileRow = await getProfileByUsername(supabase, username);
  if (!profileRow) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === profileRow.id;

  const [skills, followerCount, followingCount, postCount, engagement, viewerFollowState] = await Promise.all(
    [
      getProfileSkills(supabase, profileRow.id),
      getFollowerCount(supabase, profileRow.id),
      getFollowingCount(supabase, profileRow.id),
      getPublishedPostCount(supabase, profileRow.id),
      getProfileEngagementTotals(supabase, profileRow.id),
      user ? getFollowStateAction(profileRow.id) : Promise.resolve("none" as const),
    ],
  );

  const profile = toProfile(profileRow, skills);
  const canViewContent = isOwnProfile || !profile.isPrivate || viewerFollowState === "following";

  const [{ posts }, savedPosts, badges, skillCoinSummary] = await Promise.all([
    canViewContent
      ? getProfilePostsAction(profile.id, null)
      : Promise.resolve({ posts: [], nextCursor: null }),
    // getBookmarkedPostsAction always resolves the *current viewer's* saved posts — only
    // fetch/show it on one's own profile, never on someone else's, to avoid mislabeling
    // the viewer's own saved list as if it belonged to the profile being viewed.
    isOwnProfile ? getBookmarkedPostsAction() : Promise.resolve([]),
    getMyBadgesAction(profile.id),
    // Skill Coins balance/referral/history are personal — only ever the viewer's own.
    isOwnProfile ? getSkillCoinSummaryAction() : Promise.resolve(null),
  ]);

  const isMentor = profile.accountType === "mentor";
  const [availableSlots, mentorReviewData] =
    isMentor && canViewContent
      ? await Promise.all([getMentorAvailabilityAction(profile.id), getMentorReviewsAction(profile.id)])
      : [[], { reviews: [], average: 0, count: 0 }];

  return (
    <div>
      <ProfileHeader
        profile={profile}
        accountTypeLabel={ACCOUNT_TYPE_LABEL[profile.accountType] ?? profile.accountType}
        isOwnProfile={isOwnProfile}
        isLoggedIn={Boolean(user)}
        viewerFollowState={viewerFollowState}
      />

      {canViewContent && (
        <ProfileStatsBar
          postCount={postCount}
          followerCount={followerCount}
          followingCount={followingCount}
          totalLikes={engagement.totalLikes}
          totalComments={engagement.totalComments}
        />
      )}

      {!canViewContent && (
        <EmptyState
          icon={<Lock className="size-6" />}
          title="This account is private"
          description={`Follow @${profile.username} to see their posts.`}
          className="mt-6"
        />
      )}

      {isOwnProfile && skillCoinSummary && <SkillCoinsSummaryCard balance={skillCoinSummary.balance} />}

      {isMentor && !isOwnProfile && canViewContent && (
        <div className="glass mt-6 grid gap-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">Book a session</h2>
          <BookingWidget mentorId={profile.id} slots={availableSlots} isLoggedIn={Boolean(user)} />
          {mentorReviewData.count > 0 && (
            <>
              <h2 className="mt-2 text-lg font-semibold">Reviews</h2>
              <MentorReviews {...mentorReviewData} />
            </>
          )}
        </div>
      )}

      {canViewContent && (
        <ProfileTabs
          postsTab={
            <PostGrid
              posts={posts}
              isLoggedIn={Boolean(user)}
              currentUserId={user?.id ?? null}
              emptyState={
                <EmptyState
                  icon={<Rocket className="size-7" />}
                  title="No posts yet"
                  description={
                    isOwnProfile
                      ? "Share your knowledge and grow your network."
                      : "Shared posts will show up here."
                  }
                  action={isOwnProfile ? <CreateFirstPostButton /> : undefined}
                />
              }
            />
          }
          savedTab={
            isOwnProfile ? (
              <PostGrid
                posts={savedPosts}
                isLoggedIn={Boolean(user)}
                currentUserId={user?.id ?? null}
                emptyState={
                  <EmptyState title="Nothing saved yet" description="Posts you save will show up here." />
                }
              />
            ) : undefined
          }
          badgesTab={
            badges.length > 0 ? (
              <BadgeList badges={badges} />
            ) : (
              <EmptyState title="No badges yet" description="Keep posting and engaging to earn badges." />
            )
          }
        />
      )}
    </div>
  );
}
