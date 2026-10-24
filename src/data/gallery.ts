export type GalleryCategory =
  | "All"
  | "Campus"
  | "People"
  | "Events"
  | "Nature"
  | "Architecture"
  | "Portraits"
  | "Street"
  | "Creative";

export interface GalleryPhoto {
  id: string;
  title: string;
  caption: string;
  category: GalleryCategory;
  additionalCategories?: GalleryCategory[];
  photographer: string;
  avatarInitials?: string;
  date?: string; // ISO date string
  formattedDate?: string;
  imageSrc: string;
  alt: string;
  aspectRatio: "landscape" | "portrait" | "standard" | "wide";
  gridSpanClass?: string;
  initialLikes: number;
  likesCount?: number;
  location?: string;
  isFeatured?: boolean;
  published?: boolean;
  displayOrder?: number;
}

export const galleryCategories: GalleryCategory[] = [
  "All",
  "Campus",
  "People",
  "Events",
  "Nature",
  "Architecture",
  "Portraits",
  "Street",
  "Creative",
];

/**
 * Curated ShutterScape Gallery Photography Archive
 * Strictly matching Image 2 visual reference layout, titles, photographers, and categories.
 */
export const galleryPhotos: GalleryPhoto[] = [];
