/**
 * @module Utils
 * @description Pure utility functions — no side effects, no DOM access.
 * All functions are typed to prevent implicit `any` at call sites.
 */

/**
 * Escapes special characters for safe inclusion in HTML.
 * @param rawValue The value to escape.
 * @returns An HTML-safe string.
 */
export function escapeHtml(rawValue: unknown): string {
  return String(rawValue)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Calculates current age in years from an ISO date string.
 * @param birthDateIso The ISO birth date string.
 * @returns The age in years.
 */
export function calculateAgeYears(birthDateIso: string): number {
  const birthDate = new Date(birthDateIso);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

/**
 * Removes the protocol (http/https) from a URL string.
 * @param url The full URL.
 * @returns The URL without protocol.
 */
export function extractPublicPath(url: string): string {
  return String(url ?? '').replace(/^https?:\/\//i, '');
}

/**
 * Formats a Date object as YYYY-MM.
 * @param date The date to format.
 * @returns A string in YYYY-MM format.
 */
export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function isLikelyEmailAddress(rawEmail: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(rawEmail ?? '').trim());
}

export function isLikelyPhoneNumber(rawPhone: unknown): boolean {
  const normalized = String(rawPhone ?? '').trim();
  return /^\+?[0-9]{7,15}$/.test(normalized);
}

export function toSafeMailtoUrl(rawEmail: unknown): string {
  const trimmedEmail = String(rawEmail ?? '').trim();
  return isLikelyEmailAddress(trimmedEmail) ? `mailto:${trimmedEmail}` : '';
}

export function toSafeTelUrl(rawPhone: unknown): string {
  const normalizedPhone = String(rawPhone ?? '').replace(/[^0-9+]/g, '');
  return isLikelyPhoneNumber(normalizedPhone) ? `tel:${normalizedPhone}` : '';
}

export function toSafeExternalUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return '';
  }
  try {
    const parsedUrl = new URL(rawUrl);
    return parsedUrl.protocol === 'https:' ? parsedUrl.href : '';
  } catch {
    return '';
  }
}

export function truncateAtWordBoundary(text: unknown, maxCharacters: number): string {
  const safeText = String(text ?? '').trim();
  if (!maxCharacters || safeText.length <= maxCharacters) {
    return safeText;
  }
  const roughCut = safeText.slice(0, maxCharacters);
  const lastSpace = roughCut.lastIndexOf(' ');
  const truncated = (lastSpace > 40 ? roughCut.slice(0, lastSpace) : roughCut).trim();
  return `${truncated}...`;
}

export function countWords(text: unknown): number {
  const matches = String(text ?? '').match(/[A-Za-z0-9+#/.-]+/g);
  return matches ? matches.length : 0;
}
