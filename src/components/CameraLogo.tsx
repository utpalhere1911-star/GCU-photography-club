import React from "react";
import ShutterScapeLogo from "./ShutterScapeLogo";

interface CameraLogoProps {
  className?: string;
  size?: number;
}

/**
 * CameraLogo wrapper delegating to official ShutterScapeLogo
 */
export default function CameraLogo({ className = "", size = 36 }: CameraLogoProps) {
  return <ShutterScapeLogo height={size} className={className} />;
}

