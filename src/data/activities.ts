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

/**
 * Format date string into strict "DD / MM / YYYY" display format
 * Avoids any timezone shift by directly parsing YYYY-MM-DD components
 */
export function formatActivityDate(dateString: string): string {
  if (!dateString) return "Date TBA";
  try {
    const parts = dateString.trim().split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, "0");
      const day = parts[2].padStart(2, "0");
      return `${day} / ${month} / ${year}`;
    }
    // Fallback for valid Date strings
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day} / ${month} / ${year}`;
    }
    return dateString;
  } catch {
    return dateString;
  }
}

