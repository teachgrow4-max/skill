import { describe, expect, it } from "vitest";
import { containsEmail, containsExternalLink, containsPhoneNumber } from "./patterns";
import { containsProfanity } from "./profanity";
import { hasExcessiveCaps, hasExcessiveRepeatedChars, looksLikeSpam } from "./spam";
import { moderateText } from "./index";

describe("containsProfanity", () => {
  it("flags blocked words as whole words", () => {
    expect(containsProfanity("this is shit")).toBe(true);
  });

  it("does not flag substrings inside unrelated words", () => {
    expect(containsProfanity("I love classic cars")).toBe(false);
  });

  it("allows clean text", () => {
    expect(containsProfanity("I just shipped a new feature!")).toBe(false);
  });
});

describe("containsPhoneNumber", () => {
  it("detects a plausible phone number", () => {
    expect(containsPhoneNumber("call me at 987-654-3210")).toBe(true);
  });

  it("does not flag short numeric sequences", () => {
    expect(containsPhoneNumber("I scored 100 points")).toBe(false);
  });
});

describe("containsEmail", () => {
  it("detects an email address", () => {
    expect(containsEmail("reach me at hello@example.com")).toBe(true);
  });

  it("ignores text without an @ sign", () => {
    expect(containsEmail("no email here")).toBe(false);
  });
});

describe("containsExternalLink", () => {
  it("detects http(s) links", () => {
    expect(containsExternalLink("check out https://example.com")).toBe(true);
  });

  it("ignores plain text", () => {
    expect(containsExternalLink("just plain text")).toBe(false);
  });
});

describe("spam heuristics", () => {
  it("flags excessive caps", () => {
    expect(hasExcessiveCaps("THIS IS DEFINITELY SPAM CONTENT HERE")).toBe(true);
  });

  it("does not flag normal sentence casing", () => {
    expect(hasExcessiveCaps("This is a normal sentence.")).toBe(false);
  });

  it("flags excessive repeated characters", () => {
    expect(hasExcessiveRepeatedChars("wowwwwwwwww")).toBe(true);
  });

  it("does not flag normal repeated letters", () => {
    expect(hasExcessiveRepeatedChars("hello")).toBe(false);
  });

  it("looksLikeSpam combines both heuristics", () => {
    expect(looksLikeSpam("hello there")).toBe(false);
  });
});

describe("moderateText", () => {
  it("allows clean text", () => {
    const result = moderateText("Just shipped a new feature, excited to share it!");
    expect(result.allowed).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("blocks profanity", () => {
    const result = moderateText("this is shit");
    expect(result.allowed).toBe(false);
  });

  it("blocks contact info only when requested", () => {
    const withPhone = "call me at 987-654-3210";
    expect(moderateText(withPhone).allowed).toBe(true);
    expect(moderateText(withPhone, { blockContactInfo: true }).allowed).toBe(false);
  });
});
