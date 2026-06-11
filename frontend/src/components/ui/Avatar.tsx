"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

const BADGE_LEVELS: Record<number, { icon: string; color: string }> = {
  10:  { icon: "🔥", color: "from-orange-500 to-red-500" },
  20:  { icon: "✨", color: "from-purple-500 to-pink-500" },
  30:  { icon: "💫", color: "from-pink-500 to-rose-600" },
  40:  { icon: "💗", color: "from-red-500 to-rose-400" },
  50:  { icon: "🌊", color: "from-cyan-500 to-blue-500" },
  60:  { icon: "⭐", color: "from-yellow-400 to-amber-500" },
  70:  { icon: "🌙", color: "from-purple-600 to-indigo-600" },
  80:  { icon: "🌟", color: "from-amber-400 to-yellow-500" },
  90:  { icon: "👑", color: "from-yellow-300 to-amber-400" },
  100: { icon: "💎", color: "from-sky-400 to-blue-300" },
};

function getActiveBadge(level: number) {
  const milestones = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
  for (const m of milestones) {
    if (level >= m) return { milestone: m, ...BADGE_LEVELS[m] };
  }
  return null;
}

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  level?: number;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = "md", level, ...props }, ref) => {
    const sizes = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
      xl: "w-16 h-16 text-lg",
    };

    const badgeSizes = {
      sm: "min-w-[16px] h-[16px] text-[8px] -bottom-1 -right-1 px-[3px]",
      md: "min-w-[18px] h-[18px] text-[9px] -bottom-1 -right-1 px-[3px]",
      lg: "min-w-[20px] h-[20px] text-[10px] -bottom-1 -right-1 px-1",
      xl: "min-w-[24px] h-[24px] text-xs -bottom-1 -right-1 px-1.5",
    };

    const initials = name ? getInitials(name) : "?";
    const badge = level ? getActiveBadge(level) : null;

    const avatarEl = (
      <div
        ref={ref}
        className={cn(
          "rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0",
          "bg-grad-brand text-white font-bold",
          sizes[size],
          !level && className
        )}
        {...(level ? {} : props)}
      >
        {src ? (
          <img src={src} alt={alt || name || "Avatar"} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );

    if (!level) return avatarEl;

    return (
      <div
        ref={undefined}
        className={cn("relative inline-flex flex-shrink-0", className)}
        {...props}
      >
        {avatarEl}
        <div
          className={cn(
            "absolute flex items-center justify-center rounded-full font-bold leading-none",
            "border border-bg shadow-sm z-10",
            badgeSizes[size],
            badge
              ? `bg-gradient-to-br ${badge.color} text-white`
              : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
          )}
          title={badge ? `Level ${level} — Badge earned!` : `Level ${level}`}
        >
          {badge ? badge.icon : level}
        </div>
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
