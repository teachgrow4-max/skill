export * from "./profanity";
export * from "./patterns";
export * from "./spam";

import { containsProfanity } from "./profanity";
import { containsEmail, containsPhoneNumber } from "./patterns";
import { looksLikeSpam } from "./spam";

export interface ModerationResult {
  allowed: boolean;
  reasons: string[];
}

export interface ModerationOptions {
  /** Block sharing contact info — used for DMs to discourage moving off-platform. */
  blockContactInfo?: boolean;
}

export function moderateText(text: string, options: ModerationOptions = {}): ModerationResult {
  const reasons: string[] = [];

  if (containsProfanity(text)) {
    reasons.push("This contains language that isn't allowed. Please revise it.");
  }

  if (looksLikeSpam(text)) {
    reasons.push("This looks like spam (excessive caps or repeated characters).");
  }

  if (options.blockContactInfo) {
    if (containsPhoneNumber(text)) {
      reasons.push("Sharing phone numbers in messages isn't allowed.");
    }
    if (containsEmail(text)) {
      reasons.push("Sharing email addresses in messages isn't allowed.");
    }
  }

  return { allowed: reasons.length === 0, reasons };
}
