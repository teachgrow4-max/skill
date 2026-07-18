const PHONE_PATTERN = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?){2,4}\d{3,4}\b/;
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_PATTERN = /https?:\/\/[^\s]+|(?:www\.)[^\s]+\.[a-z]{2,}/i;

export function containsPhoneNumber(text: string): boolean {
  const digitsOnly = text.replace(/[^\d]/g, "");
  if (digitsOnly.length < 7) return false;
  return PHONE_PATTERN.test(text);
}

export function containsEmail(text: string): boolean {
  return EMAIL_PATTERN.test(text);
}

export function containsExternalLink(text: string): boolean {
  return URL_PATTERN.test(text);
}
