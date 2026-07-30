import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Camera, Coins, Flame, Globe, Lock, MapPin, Pencil, TrendingUp } from "lucide-react";
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
      <div className="gradient-hero relative -mx-4 h-48 overflow-hidden rounded-b-3xl shadow-glow-burgundy sm:h-64">
        {profile.coverUrl && (
          <Image src={profile.coverUrl} alt="" fill quality={90} className="object-cover" priority />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-50"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1.5px, transparent 1.5px)",
            backgroundSize: "20px 20px",
            maskImage: "radial-gradient(circle at 100% 0%, black, transparent 65%)",
            WebkitMaskImage: "radial-gradient(circle at 100% 0%, black, transparent 65%)",
          }}
        />
      </div>

      <div className="pb-6">
        <div className="-mt-16 flex items-end justify-between sm:-mt-20">
          <div className="group relative shrink-0">
            <Avatar className="ring-gradient-brand size-28 border-4 border-background shadow-glow transition-transform duration-300 group-hover:scale-105 sm:size-32">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.fullName} />
              <AvatarFallback className="text-3xl">{initials(profile.fullName)}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                aria-label="Change profile photo"
                className="gradient-brand absolute bottom-1 right-1 flex size-9 items-center justify-center rounded-full text-white shadow-glow-orange ring-4 ring-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Camera className="size-4" />
              </Link>
            )}
          </div>

          {isOwnProfile ? (
            <Button
              asChild
              className="gradient-brand rounded-full text-white shadow-glow transition-transform hover:-translate-y-0.5 hover:shadow-glow-orange"
            >
              <Link href="/profile/edit">
                <Pencil className="size-4" />
                Edit profile
              </Link>
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
          <h1 className="text-2xl font-bold tracking-tight">{profile.fullName}</h1>
          {profile.isVerified && <BadgeCheck className="size-5 text-primary" aria-label="Verified" />}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">@{profile.username}</p>
          {!isOwnProfile && (
            <ReportButton targetType="profile" targetId={profile.id} isLoggedIn={isLoggedIn} />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="gradient-brand rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-glow">
            {accountTypeLabel}
          </span>
          <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105">
            <TrendingUp className="size-3.5 text-primary" />
            Level {profile.level}
          </span>
          <Badge
            variant="warning"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs shadow-sm transition-transform hover:scale-105"
          >
            <Coins className="size-3.5" />
            {profile.skillCoins.toLocaleString()} Skill Coins
          </Badge>
          {profile.streakCount > 0 && (
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105">
              <Flame className="size-3.5 text-secondary" />
              {profile.streakCount} day streak
            </span>
          )}
          {profile.isPrivate && (
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105">
              <Lock className="size-3.5" />
              Private
            </span>
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
