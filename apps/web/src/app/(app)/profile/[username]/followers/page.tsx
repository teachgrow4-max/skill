import type { Metadata } from "next";
import { ProfileFollowListPage } from "@/features/profile/components/profile-follow-list-page";

export const metadata: Metadata = { title: "Followers" };

interface FollowersPageProps {
  params: Promise<{ username: string }>;
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { username } = await params;
  return <ProfileFollowListPage username={username} mode="followers" />;
}
