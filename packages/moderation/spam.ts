export function hasExcessiveCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 15) return false;
  const upper = letters.replace(/[^A-Z]/g, "");
  return upper.length / letters.length > 0.7;
}

export function hasExcessiveRepeatedChars(text: string): boolean {
  return /(.)\1{6,}/.test(text);
}

export function looksLikeSpam(text: string): boolean {
  return hasExcessiveCaps(text) || hasExcessiveRepeatedChars(text);
}
