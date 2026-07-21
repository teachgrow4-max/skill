import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Globe, Lock, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from "@skilltego/ui";
import { initials } from "@skilltego/utils";
import type { Profile } from "@skilltego/types";
import type { FollowState } from "../social-actions";
import { FollowButton } from "./follow-button";
import { MessageButton } from "@/features/messaging/components/message-button";
import { ReportButton } from "@/features/reports/components/report-button";

interface ProfileHeaderProps {
  profile: Profile;
  accountTypeLabel: string;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  viewerFollowState: FollowState;
}

export function ProfileHeader({
  profile,
  accountTypeLabel,
  isOwnProfile,
  isLoggedIn,
  viewerFollowState,
}: ProfileHeaderProps) {
  return (
    <div>
      <div className="relative -mx-4 h-40 bg-gradient-to-r from-primary/40 to-secondary/40 sm:h-56">
        {profile.coverUrl && <Image src={profile.coverUrl} alt="" fill className="object-cover" priority />}
      </div>

      <div className="pb-6">
        <div className="-mt-14 flex items-end justify-between sm:-mt-16">
          <Avatar className="size-28 border-4 border-background sm:size-32">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.fullName} />
            <AvatarFallback className="text-3xl">{initials(profile.fullName)}</AvatarFallback>
          </Avatar>

          {isOwnProfile ? (
            <Button asChild variant="outline">
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
          ) : (
            <div className="flex gap-2">
              <MessageButton targetUserId={profile.id} isLoggedIn={isLoggedIn} />
              <FollowButton
                targetProfileId={profile.id}
                targetUsername={profile.username}
                initialState={viewerFollowState}
                isLoggedIn={isLoggedIn}
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
            <ReportButton targetType="profile" targetId={profile.id} isLoggedIn={isLoggedIn} />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{accountTypeLabel}</Badge>
          <Badge variant="outline">Level {profile.level}</Badge>
          <Badge variant="outline">{profile.xp} XP</Badge>
          {profile.streakCount > 0 && <Badge variant="outline">{profile.streakCount} day streak</Badge>}
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

        {profile.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill.name} variant="outline">
                {skill.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
