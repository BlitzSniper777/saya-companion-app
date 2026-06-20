"use client";
import { useId } from "react";

export function SayaLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, "sl");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B0764"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="44" fill={`url(#${uid})`}/>
      <path d="M60 74 A42 42 0 0 1 140 74" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
      <ellipse cx="76" cy="100" rx="10" ry="11" fill="white"/>
      <ellipse cx="124" cy="98" rx="11" ry="12" fill="white"/>
      <path d="M70 128 Q100 152 130 128" stroke="white" strokeWidth="9" fill="none" strokeLinecap="round"/>
      <path d="M148 46 L151 54 L159 57 L151 60 L148 68 L145 60 L137 57 L145 54Z" fill="white" opacity="0.7"/>
    </svg>
  );
}
