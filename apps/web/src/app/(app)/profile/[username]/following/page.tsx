import type { Metadata } from "next";
import { ProfileFollowListPage } from "@/features/profile/components/profile-follow-list-page";

export const metadata: Metadata = { title: "Following" };

interface FollowingPageProps {
  params: Promise<{ username: string }>;
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { username } = await params;
  return <ProfileFollowListPage username={username} mode="following" />;
}
