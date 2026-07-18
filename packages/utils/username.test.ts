import { describe, expect, it } from "vitest";
import { isValidUsername, slugifyUsername } from "./username";

describe("isValidUsername", () => {
  it("accepts valid lowercase usernames", () => {
    expect(isValidUsername("nithin_kumar")).toBe(true);
    expect(isValidUsername("abc")).toBe(true);
  });

  it("rejects usernames that are too short or too long", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("a".repeat(31))).toBe(false);
  });

  it("rejects reserved usernames", () => {
    expect(isValidUsername("admin")).toBe(false);
    expect(isValidUsername("settings")).toBe(false);
  });

  it("rejects usernames with consecutive underscores", () => {
    expect(isValidUsername("john__doe")).toBe(false);
  });

  it("rejects usernames with invalid characters", () => {
    expect(isValidUsername("john.doe")).toBe(false);
    expect(isValidUsername("john doe")).toBe(false);
  });

  it("is case-insensitive since usernames are normalized to lowercase", () => {
    expect(isValidUsername("JohnDoe")).toBe(true);
  });
});

describe("slugifyUsername", () => {
  it("lowercases and replaces invalid characters with underscores", () => {
    expect(slugifyUsername("John Doe")).toBe("john_doe");
  });

  it("strips diacritics", () => {
    expect(slugifyUsername("Renée")).toBe("renee");
  });

  it("collapses repeated separators", () => {
    expect(slugifyUsername("John   Doe!!!")).toBe("john_doe");
  });

  it("truncates to the max length", () => {
    expect(slugifyUsername("a".repeat(50)).length).toBeLessThanOrEqual(30);
  });
});
