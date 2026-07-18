export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

/**
 * Reserved to prevent collisions with app routes (e.g. /settings, /login)
 * and impersonation of core surfaces (e.g. /admin, /skilltego).
 */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "api",
  "app",
  "about",
  "auth",
  "blog",
  "careers",
  "company",
  "companies",
  "contact",
  "college",
  "colleges",
  "dashboard",
  "explore",
  "faq",
  "feed",
  "help",
  "home",
  "login",
  "logout",
  "mentor",
  "mentors",
  "messages",
  "moderator",
  "notifications",
  "onboarding",
  "org",
  "pricing",
  "privacy",
  "profile",
  "root",
  "settings",
  "signup",
  "signin",
  "skilltego",
  "support",
  "terms",
  "verify",
]);

export function isValidUsername(username: string): boolean {
  const value = username.toLowerCase();
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) return false;
  if (RESERVED_USERNAMES.has(value)) return false;
  if (value.includes("__")) return false;
  return USERNAME_REGEX.test(value);
}

const DIACRITIC_MARKS = /[̀-ͯ]/g;

export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(DIACRITIC_MARKS, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, USERNAME_MAX);
}
