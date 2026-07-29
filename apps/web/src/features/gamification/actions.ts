"use server";

import {
  getLeaderboard,
  getProfileBadges,
  getProfileById,
  getSkillCoinEvents,
  getSkillCoinTotals,
  recordDailyActivity,
  toAuthorSummary,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import type { Badge, LeaderboardEntry, SkillCoinsSummary } from "@skilltego/types";

const COINS_PER_LEVEL = 100;

export async function recordDailyActivityAction(): Promise<{ streak: number; coinsAwarded: number } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return recordDailyActivity(supabase, user.id);
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

export async function getSkillCoinSummaryAction(): Promise<SkillCoinsSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const [profile, events, totals] = await Promise.all([
      getProfileById(supabase, user.id),
      getSkillCoinEvents(supabase, user.id),
      getSkillCoinTotals(supabase, user.id),
    ]);
    if (!profile) return null;

    return {
      balance: profile.skill_coins,
      level: profile.level,
      coinsIntoLevel: profile.skill_coins % COINS_PER_LEVEL,
      coinsPerLevel: COINS_PER_LEVEL,
      streakCount: profile.streak_count,
      totalEarned: totals.earned,
      totalRedeemed: totals.redeemed,
      referralCode: profile.referral_code,
      totalReferrals: profile.total_referrals,
      history: events.map((event) => ({
        amount: event.amount,
        reason: event.reason,
        createdAt: event.created_at,
      })),
    };
  } catch (error) {
    // Degrades to hiding the rewards section instead of crashing the whole
    // profile page — e.g. if the skill_coin_events migration hasn't been
    // applied to this environment's database yet.
    console.error("getSkillCoinSummaryAction failed", error);
    return null;
  }
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
