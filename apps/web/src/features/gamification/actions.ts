"use server";

import { getLeaderboard, getProfileBadges, recordDailyActivity, toAuthorSummary } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import type { Badge, LeaderboardEntry } from "@skilltego/types";

export async function recordDailyActivityAction(): Promise<{ streak: number } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const streak = await recordDailyActivity(supabase, user.id);
  return { streak };
}

export async function getMyBadgesAction(profileId: string): Promise<Badge[]> {
  const supabase = await createClient();
  const earned = await getProfileBadges(supabase, profileId);
  return earned.map(({ badge, earnedAt }) => ({
    id: badge.id,
    slug: badge.slug,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    earnedAt,
  }));
}

export async function getLeaderboardAction(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const rows = await getLeaderboard(supabase, 50);
  return rows.map((row, index) => ({
    profile: toAuthorSummary(row),
    skillCoins: row.skill_coins,
    level: row.level,
    rank: index + 1,
  }));
}
