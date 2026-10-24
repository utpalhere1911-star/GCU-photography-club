import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "ShutterScape — Photography Club · GCU",
  description:
    "A student community capturing campus life, creative perspectives, and the moments that bring us together. Official Photography Club of Girijananda Chowdhury University (GCU), Guwahati, Assam.",
  keywords: [
    "ShutterScape",
    "GCU",
    "Girijananda Chowdhury University",
    "Photography Club",
    "Guwahati",
    "Assam",
    "Campus Photography",
  ],
  authors: [{ name: "ShutterScape GCU" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full dark`}
    >
      <body className="min-h-full flex flex-col bg-[#08090A] text-[#F5F5F3] antialiased selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
