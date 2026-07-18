import type { Profile, ProfileRow, ProfileSkillRow, SocialLinks } from "@skilltego/types";

export function toProfile(row: ProfileRow, skills: ProfileSkillRow[] = []): Profile {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    accountType: row.account_type,
    avatarUrl: row.avatar_url,
    coverUrl: row.cover_url,
    bio: row.bio,
    country: row.country,
    state: row.state,
    city: row.city,
    school: row.school,
    college: row.college,
    company: row.company,
    website: row.website,
    socials: (row.socials as SocialLinks | null) ?? {},
    languages: row.languages ?? [],
    availability: row.availability,
    isVerified: row.is_verified,
    xp: row.xp,
    coins: row.coins,
    level: row.level,
    onboardingCompleted: row.onboarding_completed,
    skills: skills.map((skill) => ({
      name: skill.skill_name,
      category: skill.category,
      proficiency: skill.proficiency,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
