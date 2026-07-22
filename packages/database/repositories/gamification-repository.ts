import type { SupabaseClient } from "@supabase/supabase-js";
import type { BadgeRow, Database, ProfileRow } from "@skilltego/types";

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

/** Updates streak/Skill Coins for a daily visit; returns the new streak count. Idempotent per calendar day. */
export async function recordDailyActivity(client: Client, profileId: string): Promise<number> {
  const { data: profile, error } = await client
    .from("profiles")
    .select("skill_coins, streak_count, last_active_date")
    .eq("id", profileId)
    .single();
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  if (profile.last_active_date === today) return profile.streak_count;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const newStreak = profile.last_active_date === yesterday ? profile.streak_count + 1 : 1;
  const newSkillCoins = profile.skill_coins + 5;

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

  if (newStreak >= 7) {
    const { data: badge } = await client.from("badges").select("id").eq("slug", "week_streak").maybeSingle();
    if (badge) {
      await client
        .from("profile_badges")
        .upsert({ profile_id: profileId, badge_id: badge.id }, { onConflict: "profile_id,badge_id" });
    }
  }

  return newStreak;
}
