import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, Globe, Lock, MapPin } from "lucide-react";
import {
  getFollowerCount,
  getFollowingCount,
  getProfileByUsername,
  getProfileSkills,
  toProfile,
} from "@skilltego/database";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import { createClient } from "@/lib/supabase/server";
import { FollowButton } from "@/features/profile/components/follow-button";
import { getFollowStateAction } from "@/features/profile/social-actions";
import { getProfilePostsAction } from "@/features/posts/actions";
import { PostCard } from "@/features/posts/components/post-card";
import { MessageButton } from "@/features/messaging/components/message-button";
import { ReportButton } from "@/features/reports/components/report-button";
import { getMentorAvailabilityAction, getMentorReviewsAction } from "@/features/mentorship/actions";
import { BookingWidget } from "@/features/mentorship/components/booking-widget";
import { MentorReviews } from "@/features/mentorship/components/mentor-reviews";
import { getMyBadgesAction } from "@/features/gamification/actions";
import { BadgeList } from "@/features/gamification/components/badge-list";

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

  const [skills, followerCount, followingCount, viewerFollowState] = await Promise.all([
    getProfileSkills(supabase, profileRow.id),
    getFollowerCount(supabase, profileRow.id),
    getFollowingCount(supabase, profileRow.id),
    user ? getFollowStateAction(profileRow.id) : Promise.resolve("none" as const),
  ]);

  const profile = toProfile(profileRow, skills);
  const isOwnProfile = user?.id === profile.id;
  const canViewContent = isOwnProfile || !profile.isPrivate || viewerFollowState === "following";

  const [{ posts }, badges] = await Promise.all([
    canViewContent
      ? getProfilePostsAction(profile.id, null)
      : Promise.resolve({ posts: [], nextCursor: null }),
    getMyBadgesAction(profile.id),
  ]);

  const isMentor = profile.accountType === "mentor";
  const [availableSlots, mentorReviewData] =
    isMentor && canViewContent
      ? await Promise.all([getMentorAvailabilityAction(profile.id), getMentorReviewsAction(profile.id)])
      : [[], { reviews: [], average: 0, count: 0 }];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="glass overflow-hidden rounded-2xl">
        <div className="relative h-32 bg-gradient-to-r from-primary/40 to-secondary/40 sm:h-44">
          {profile.coverUrl && <Image src={profile.coverUrl} alt="" fill className="object-cover" priority />}
        </div>

        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <Avatar className="size-24 border-4 border-background">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.fullName} />
              <AvatarFallback className="text-2xl">{initials(profile.fullName)}</AvatarFallback>
            </Avatar>

            {isOwnProfile ? (
              <Button asChild variant="outline">
                <Link href="/profile/edit">Edit profile</Link>
              </Button>
            ) : (
              <div className="flex gap-2">
                <MessageButton targetUserId={profile.id} isLoggedIn={Boolean(user)} />
                <FollowButton
                  targetProfileId={profile.id}
                  targetUsername={profile.username}
                  initialState={viewerFollowState}
                  isLoggedIn={Boolean(user)}
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-2xl font-bold">{profile.fullName}</h1>
            {profile.isVerified && <BadgeCheck className="size-5 text-primary" aria-label="Verified" />}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">@{profile.username}</p>
            {!isOwnProfile && (
              <ReportButton targetType="profile" targetId={profile.id} isLoggedIn={Boolean(user)} />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {ACCOUNT_TYPE_LABEL[profile.accountType] ?? profile.accountType}
            </Badge>
            <Badge variant="outline">Level {profile.level}</Badge>
            <Badge variant="outline">{profile.xp} XP</Badge>
            {profile.isPrivate && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="size-3" />
                Private
              </Badge>
            )}
          </div>

          {profile.bio && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{profile.bio}</p>}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {(profile.city || profile.state || profile.country) && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Globe className="size-4" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <span>
              <strong>{followerCount}</strong> <span className="text-muted-foreground">Followers</span>
            </span>
            <span>
              <strong>{followingCount}</strong> <span className="text-muted-foreground">Following</span>
            </span>
          </div>

          {badges.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Badges</h2>
              <BadgeList badges={badges} />
            </div>
          )}

          {profile.skills.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill.name} variant="outline">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!canViewContent && (
        <div className="glass mt-6 grid justify-items-center gap-2 rounded-2xl p-10 text-center">
          <Lock className="size-8 text-muted-foreground" />
          <p className="font-semibold">This account is private</p>
          <p className="text-sm text-muted-foreground">Follow @{profile.username} to see their posts.</p>
        </div>
      )}

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

      {canViewContent && posts.length > 0 && (
        <div className="mt-6 grid gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} isLoggedIn={Boolean(user)} currentUserId={user?.id ?? null} />
          ))}
        </div>
      )}
    </div>
  );
}
