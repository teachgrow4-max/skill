import type { SupabaseClient } from "@supabase/supabase-js";
import type { BadgeRow, Database, ProfileRow, SkillCoinEventRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export interface EarnedBadge {
  badge: BadgeRow;
  earnedAt: string;
}

export async function getProfileBadges(client: Client, profileId: string): Promise<EarnedBadge[]> {
  const { data: links, error: linksError } = await client
    .from("profile_badges")
    .select("badge_id, earned_at")
    .eq("profile_id", profileId)
    .order("earned_at", { ascending: false });
  if (linksError) throw linksError;
  if (links.length === 0) return [];

  const badgeIds = links.map((link) => link.badge_id);
  const { data: badges, error: badgesError } = await client.from("badges").select("*").in("id", badgeIds);
  if (badgesError) throw badgesError;

  const badgeMap = new Map(badges.map((badge) => [badge.id, badge]));
  return links
    .filter((link) => badgeMap.has(link.badge_id))
    .map((link) => ({ badge: badgeMap.get(link.badge_id)!, earnedAt: link.earned_at }));
}

export async function getLeaderboard(client: Client, limit = 50): Promise<ProfileRow[]> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("skill_coins", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export interface DailyActivityResult {
  streak: number;
  coinsAwarded: number;
}

/**
 * Updates streak/Skill Coins for a daily visit; returns the new streak and coins awarded.
 * Idempotent per calendar day. Runs as a security definer function (migration 0024) —
 * users can't write their own skill_coins/streak columns directly.
 */
export async function recordDailyActivity(client: Client): Promise<DailyActivityResult> {
  const { data, error } = await client.rpc("record_daily_activity");
  if (error) throw error;
  return { streak: data.streak, coinsAwarded: data.coins_awarded };
}

export async function getSkillCoinEvents(
  client: Client,
  profileId: string,
  limit = 20,
): Promise<SkillCoinEventRow[]> {
  const { data, error } = await client
    .from("skill_coin_events")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export interface SkillCoinTotals {
  earned: number;
  redeemed: number;
}

/** Sums the full ledger by sign, independent of getSkillCoinEvents' capped history — stays
 *  accurate once a redemption feature starts writing negative-amount events. */
export async function getSkillCoinTotals(client: Client, profileId: string): Promise<SkillCoinTotals> {
  const { data, error } = await client.from("skill_coin_events").select("amount").eq("profile_id", profileId);
  if (error) throw error;

  return data.reduce(
    (totals, { amount }) =>
      amount >= 0
        ? { ...totals, earned: totals.earned + amount }
        : { ...totals, redeemed: totals.redeemed - amount },
    { earned: 0, redeemed: 0 },
  );
}

/** Awards the one-time complete-profile bonus via a security-definer RPC scoped to the caller's own row. */
export async function claimCompleteProfileBonus(client: Client): Promise<number> {
  const { data, error } = await client.rpc("claim_complete_profile_bonus");
  if (error) throw error;
  return data ?? 0;
}
