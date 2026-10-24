export type ActivityCategory =
  | "All Activities"
  | "Photo Walk"
  | "Exhibition"
  | "Workshop"
  | "Challenge"
  | "Event Coverage";

export type ActivityStatus = "upcoming" | "ongoing" | "past";
export type RegistrationStatus = "Upcoming" | "Registration Open" | "Registration Closed";

export interface Activity {
  id: string;
  title: string;
  category: Exclude<ActivityCategory, "All Activities">;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  galleryImages?: string[];
  startDate: string; // ISO format: YYYY-MM-DD
  endDate?: string;
  time?: string;
  venue: string;
  status: ActivityStatus;
  registrationStatus?: RegistrationStatus;
  registrationUrl?: string;
  isFeaturedUpcoming?: boolean;
  published: boolean;
  year: number;
}

export const activitiesData: Activity[] = [];

export interface FormatActivityDateOptions {
  detailed?: boolean;
}

const SHORT_MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

function parseDateComponents(dateStr?: string | null): DateParts | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Handles YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss, etc. directly without timezone skew
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (
      !isNaN(year) &&
      !isNaN(month) &&
      !isNaN(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return { year, month, day };
    }
  }

  // Handles YYYY/MM/DD
  const slashMatch = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const year = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10);
    const day = parseInt(slashMatch[3], 10);
    if (
      !isNaN(year) &&
      !isNaN(month) &&
      !isNaN(day) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return { year, month, day };
    }
  }

  // Fallback for other valid Date strings (uses UTC to prevent local timezone offsets)
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    };
  }

  return null;
}

/**
 * Clean, editorial date and date-range formatter for ShutterScape activities.
 *
 * Supports:
 * - Single date: "24 OCT 2026" or "24 October 2026" (detailed)
 * - Multi-day range (same month & year): "24–26 OCT 2026" or "24–26 October 2026"
 * - Multi-day range (diff month, same year): "28 OCT – 2 NOV 2026" or "28 October – 2 November 2026"
 * - Multi-day range (diff year): "30 DEC 2026 – 3 JAN 2027" or "30 December 2026 – 3 January 2027"
 *
 * Avoids any timezone shift by directly parsing date components.
 */
export function formatActivityDate(
  startDate?: string | null,
  endDateOrOptions?: string | null | FormatActivityDateOptions,
  maybeOptions?: FormatActivityDateOptions
): string {
  if (!startDate) return "Date TBA";

  let endDate: string | null | undefined = undefined;
  let options: FormatActivityDateOptions | undefined = maybeOptions;

  if (typeof endDateOrOptions === "object" && endDateOrOptions !== null) {
    options = endDateOrOptions;
    endDate = undefined;
  } else if (typeof endDateOrOptions === "string") {
    endDate = endDateOrOptions;
  }

  const isDetailed = Boolean(options?.detailed);
  const months = isDetailed ? FULL_MONTHS : SHORT_MONTHS;

  const start = parseDateComponents(startDate);
  if (!start) {
    return startDate;
  }

  const end = endDate ? parseDateComponents(endDate) : null;

  // Single date or end date matches start date or end date is missing
  if (
    !end ||
    (start.year === end.year &&
      start.month === end.month &&
      start.day === end.day)
  ) {
    return `${start.day} ${months[start.month - 1]} ${start.year}`;
  }

  // Ensure end date is not logically before start date
  const startTime = new Date(
    Date.UTC(start.year, start.month - 1, start.day)
  ).getTime();
  const endTime = new Date(
    Date.UTC(end.year, end.month - 1, end.day)
  ).getTime();
  if (endTime < startTime) {
    return `${start.day} ${months[start.month - 1]} ${start.year}`;
  }

  // Same month and same year: e.g. "24–26 OCT 2026"
  if (start.year === end.year && start.month === end.month) {
    return `${start.day}–${end.day} ${months[start.month - 1]} ${start.year}`;
  }

  // Different month, same year: e.g. "28 OCT – 2 NOV 2026"
  if (start.year === end.year) {
    return `${start.day} ${months[start.month - 1]} – ${end.day} ${
      months[end.month - 1]
    } ${start.year}`;
  }

  // Different year: e.g. "30 DEC 2026 – 3 JAN 2027"
  return `${start.day} ${months[start.month - 1]} ${start.year} – ${
    end.day
  } ${months[end.month - 1]} ${end.year}`;
}

