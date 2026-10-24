import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery — Moments in Frames | ShutterScape GCU",
  description:
    "A visual journey through the eyes of our community — capturing campus life, people, places and perspectives that make Girijananda Chowdhury University (GCU) special.",
  keywords: [
    "ShutterScape Gallery",
    "GCU Photography",
    "Girijananda Chowdhury University",
    "Student Photography",
    "Guwahati",
    "Assam",
    "Campus Moments",
  ],
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
