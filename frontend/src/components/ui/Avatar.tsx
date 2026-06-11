"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { BadgeIcon, getBadgeTier } from "@/components/ui/BadgeIcon";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  level?: number;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = "md", level, ...props }, ref) => {
    const avatarSizes = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
      xl: "w-16 h-16 text-lg",
    };

    // Badge chip pixel sizes
    const chipPx = { sm: 18, md: 22, lg: 26, xl: 30 };
    const numSize = {
      sm: "text-[7px]",
      md: "text-[7.5px]",
      lg: "text-[8.5px]",
      xl: "text-[10px]",
    };
    const chipPos = {
      sm: "-bottom-1 -right-1",
      md: "-bottom-1 -right-1",
      lg: "-bottom-1.5 -right-1.5",
      xl: "-bottom-1.5 -right-1.5",
    };

    const initials = name ? getInitials(name) : "?";
    const tierLevel = level != null ? getBadgeTier(level) : null;

    const avatarEl = (
      <div
        className={cn(
          "rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0",
          "bg-grad-brand text-white font-bold",
          avatarSizes[size],
        )}
      >
        {src ? (
          <img src={src} alt={alt || name || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );

    if (level == null) {
      return (
        <div ref={ref} className={cn("inline-flex flex-shrink-0", className)} {...props}>
          {avatarEl}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("relative inline-flex flex-shrink-0", className)} {...props}>
        {avatarEl}

        {/* Badge chip: BadgeIcon behind, level number on top centered */}
        <div
          className={cn("absolute z-10 border-[1.5px] border-bg rounded-full shadow-md", chipPos[size])}
          style={{ width: chipPx[size], height: chipPx[size] }}
          title={`Level ${level}${tierLevel ? ` — ${["Ember","Spark","Flame","Heartbound","Soulbound","Devotion","Eternal","Transcendent","Divine","Ascended"][tierLevel / 10 - 1]} badge` : ""}`}
        >
          {/* Tier badge icon fills the chip */}
          {tierLevel ? (
            <BadgeIcon tier={tierLevel} size={chipPx[size]} />
          ) : (
            <div
              className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
            />
          )}
          {/* Level number — centered on top */}
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "font-black text-white leading-none drop-shadow-sm",
              numSize[size],
            )}
          >
            {level}
          </span>
        </div>
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
