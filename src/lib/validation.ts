/**
 * Input validation and sanitization helpers for ShutterScape API endpoints.
 */

/**
 * Validates that an identifier (e.g., photoId, activityId, teamMemberId) contains
 * only safe URL-friendly characters and does not exceed maximum length.
 */
export function isValidIdentifier(id?: unknown): boolean {
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  if (trimmed.length < 1 || trimmed.length > 128) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(trimmed);
}

/**
 * Validates that a URL uses safe protocols (http, https, mailto, tel) and blocks
 * dangerous active pseudo-protocols like javascript: or data:text/html.
 */
export function isSafeUrl(url?: unknown): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:text/html")
  ) {
    return false;
  }

  // Relative paths are safe
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" || parsed.protocol === "mailto:";
  } catch {
    return false;
  }
}

/**
 * Sanitizes and bounds input text strings.
 */
export function sanitizeString(
  input: unknown,
  maxLength = 500,
  defaultValue = ""
): string {
  if (typeof input !== "string") return defaultValue;
  return input.trim().slice(0, maxLength);
}
