
export function escapeHtml(rawValue) {
  return String(rawValue)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function calculateAgeYears(birthDateIso) {
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

export function extractPublicPath(url) {
  return String(url || "").replace(/^https?:\/\//i, "");
}

export function formatYearMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return year + "-" + month;
}

export function clampNumber(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function isLikelyEmailAddress(rawEmail) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(rawEmail || "").trim());
}

export function isLikelyPhoneNumber(rawPhone) {
  const normalized = String(rawPhone || "").trim();
  return /^\+?[0-9]{7,15}$/.test(normalized);
}

export function toSafeMailtoUrl(rawEmail) {
  const trimmedEmail = String(rawEmail || "").trim();
  return isLikelyEmailAddress(trimmedEmail) ? "mailto:" + trimmedEmail : "";
}

export function toSafeTelUrl(rawPhone) {
  const normalizedPhone = String(rawPhone || "").replace(/[^0-9+]/g, "");
  return isLikelyPhoneNumber(normalizedPhone) ? "tel:" + normalizedPhone : "";
}

export function toSafeExternalUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return "";
  }

  try {
    const parsedUrl = new URL(rawUrl);
    return parsedUrl.protocol === "https:" ? parsedUrl.href : "";
  } catch (error) {
    return "";
  }
}

export function truncateAtWordBoundary(text, maxCharacters) {
  const safeText = String(text || "").trim();
  if (!maxCharacters || safeText.length <= maxCharacters) {
    return safeText;
  }
  const roughCut = safeText.slice(0, maxCharacters);
  const lastSpace = roughCut.lastIndexOf(" ");
  const truncated = (lastSpace > 40 ? roughCut.slice(0, lastSpace) : roughCut).trim();
  return truncated + "...";
}

export function countWords(text) {
  const matches = String(text || "").match(/[A-Za-z0-9+#/.-]+/g);
  return matches ? matches.length : 0;
}
