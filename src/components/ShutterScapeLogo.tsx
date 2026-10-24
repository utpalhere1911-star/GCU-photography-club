"use client";

import React from "react";
import Image from "next/image";

interface ShutterScapeLogoProps {
  className?: string;
  height?: number;
  variant?: "white" | "black";
  priority?: boolean;
}

/**
 * Official ShutterScape Brand Logo Component
 * Source: Official ShutterScape Google Drive Branding Assets
 * Preserves the original 908x466 aspect ratio (~1.95:1)
 */
export default function ShutterScapeLogo({
  className = "",
  height = 36,
  variant = "white",
  priority = false,
}: ShutterScapeLogoProps) {
  // Original aspect ratio 908 / 466 ≈ 1.9485
  const width = Math.round(height * 1.9485);
  const src =
    variant === "black"
      ? "/images/shutterscape-logo-black.png"
      : "/images/shutterscape-logo.png";

  return (
    <div
      className={`relative inline-block shrink-0 select-none ${className}`}
      style={{ height, width }}
    >
      <Image
        src={src}
        alt="ShutterScape — Photography Club of Girijananda Chowdhury University"
        fill
        sizes={`${width * 2}px`}
        priority={priority}
        className="object-contain object-left"
      />
    </div>
  );
}
