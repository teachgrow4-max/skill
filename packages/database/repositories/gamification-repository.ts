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
    .order("xp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

function levelForXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

/** Updates streak/XP for a daily visit; returns the new streak count. Idempotent per calendar day. */
export async function recordDailyActivity(client: Client, profileId: string): Promise<number> {
  const { data: profile, error } = await client
    .from("profiles")
    .select("xp, coins, streak_count, last_active_date")
    .eq("id", profileId)
    .single();
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  if (profile.last_active_date === today) return profile.streak_count;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const newStreak = profile.last_active_date === yesterday ? profile.streak_count + 1 : 1;
  const newXp = profile.xp + 5;

  const { error: updateError } = await client
    .from("profiles")
    .update({
      streak_count: newStreak,
      last_active_date: today,
      xp: newXp,
      coins: profile.coins + 1,
      level: levelForXp(newXp),
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
