import React from "react";

interface GCUEmblemProps {
  className?: string;
  size?: number;
}

export default function GCUEmblem({ className = "w-10 h-10", size = 40 }: GCUEmblemProps) {
  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-[#303338] shadow-sm shadow-black/40 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black ${className}`}
      style={{ width: size, height: size }}
      title="Girijananda Chowdhury University Emblem"
    >
      <svg
        width={size * 0.85}
        height={size * 0.85}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="46" stroke="#858A91" strokeWidth="2" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="41" stroke="#D5D9DE" strokeWidth="1.8" />
        
        {/* Flame / Diya / Knowledge Motif in Crisp Monochrome */}
        <path
          d="M50 22C46 32 40 40 40 48C40 56 44.5 62 50 62C55.5 62 60 56 60 48C60 40 54 32 50 22Z"
          fill="#FFFFFF"
        />
        <path
          d="M50 32C48 37 44 43 44 48C44 53 47 56 50 56C53 56 56 53 56 48C56 43 52 37 50 32Z"
          fill="#D5D9DE"
        />
        
        {/* Open Book Base */}
        <path
          d="M26 68C34 64 42 65 50 69C58 65 66 64 74 68V76C66 72 58 73 50 77C42 73 34 72 26 76V68Z"
          fill="#F5F5F3"
          stroke="#858A91"
          strokeWidth="1.5"
        />
        
        {/* Tiny stars */}
        <circle cx="28" cy="45" r="2" fill="#FFFFFF" />
        <circle cx="72" cy="45" r="2" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
