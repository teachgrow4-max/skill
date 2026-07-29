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

function levelForSkillCoins(skillCoins: number): number {
  return Math.floor(skillCoins / 100) + 1;
}

const DAILY_LOGIN_REWARD = 2;
const STREAK_BONUSES: Record<number, number> = { 7: 30, 30: 150 };

export interface DailyActivityResult {
  streak: number;
  coinsAwarded: number;
}

/** Updates streak/Skill Coins for a daily visit; returns the new streak and coins awarded. Idempotent per calendar day. */
export async function recordDailyActivity(client: Client, profileId: string): Promise<DailyActivityResult> {
  const { data: profile, error } = await client
    .from("profiles")
    .select("skill_coins, streak_count, last_active_date")
    .eq("id", profileId)
    .single();
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  if (profile.last_active_date === today) return { streak: profile.streak_count, coinsAwarded: 0 };

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const newStreak = profile.last_active_date === yesterday ? profile.streak_count + 1 : 1;
  const streakBonus = STREAK_BONUSES[newStreak] ?? 0;
  const newSkillCoins = profile.skill_coins + DAILY_LOGIN_REWARD + streakBonus;

  const { error: updateError } = await client
    .from("profiles")
    .update({
      streak_count: newStreak,
      last_active_date: today,
      skill_coins: newSkillCoins,
      level: levelForSkillCoins(newSkillCoins),
    })
    .eq("id", profileId);
  if (updateError) throw updateError;

  const events = [{ profile_id: profileId, amount: DAILY_LOGIN_REWARD, reason: "Daily login" }];
  if (streakBonus > 0) {
    events.push({ profile_id: profileId, amount: streakBonus, reason: `${newStreak}-day streak bonus` });
  }
  await client.from("skill_coin_events").insert(events);

  if (newStreak >= 7) {
    const { data: badge } = await client.from("badges").select("id").eq("slug", "week_streak").maybeSingle();
    if (badge) {
      await client
        .from("profile_badges")
        .upsert({ profile_id: profileId, badge_id: badge.id }, { onConflict: "profile_id,badge_id" });
    }
  }

  return { streak: newStreak, coinsAwarded: DAILY_LOGIN_REWARD + streakBonus };
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

/** Awards the one-time complete-profile bonus via a security-definer RPC scoped to the caller's own row. */
export async function claimCompleteProfileBonus(client: Client): Promise<number> {
  const { data, error } = await client.rpc("claim_complete_profile_bonus");
  if (error) throw error;
  return data ?? 0;
}
