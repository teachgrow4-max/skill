/**
 * Minimal, non-exhaustive block list for obvious profanity/slurs. This is a
 * blunt first line of defense — Phase 5 adds an Ollama-backed classifier for
 * nuanced cases (harassment, hate speech in context, etc).
 */
const BLOCKED_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "piss",
  "slut",
  "whore",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "chink",
  "spic",
  "kike",
];

const BLOCKED_TERMS_PATTERN = new RegExp(`\\b(${BLOCKED_TERMS.join("|")})\\b`, "i");

export function containsProfanity(text: string): boolean {
  return BLOCKED_TERMS_PATTERN.test(text);
}

export function censorProfanity(text: string): string {
  return text.replace(new RegExp(`\\b(${BLOCKED_TERMS.join("|")})\\b`, "gi"), (match) =>
    "*".repeat(match.length),
  );
}
