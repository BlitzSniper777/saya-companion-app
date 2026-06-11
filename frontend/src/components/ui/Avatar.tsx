"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

const BADGE_TIERS: Record<number, { icon: string; color: string }> = {
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

function getActiveTier(level: number) {
  for (const m of [100, 90, 80, 70, 60, 50, 40, 30, 20, 10]) {
    if (level >= m) return { milestone: m, ...BADGE_TIERS[m] };
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
    const avatarSizes = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
      xl: "w-16 h-16 text-lg",
    };

    // Badge: icon sits behind, level number floats centered on top
    const badgeWrap = {
      sm: "w-[18px] h-[18px] -bottom-1 -right-1",
      md: "w-[22px] h-[22px] -bottom-1 -right-1",
      lg: "w-[26px] h-[26px] -bottom-1.5 -right-1.5",
      xl: "w-[30px] h-[30px] -bottom-1.5 -right-1.5",
    };
    const iconSize = {
      sm: "text-[9px]",
      md: "text-[11px]",
      lg: "text-[13px]",
      xl: "text-[16px]",
    };
    const numSize = {
      sm: "text-[7px]",
      md: "text-[8px]",
      lg: "text-[9px]",
      xl: "text-[11px]",
    };

    const initials = name ? getInitials(name) : "?";
    const tier = level != null ? getActiveTier(level) : null;

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

        {/* Badge chip: tier icon behind, level number centered on top */}
        <div
          className={cn(
            "absolute rounded-full flex items-center justify-center",
            "border-[1.5px] border-bg shadow-md z-10",
            badgeWrap[size],
            tier
              ? `bg-gradient-to-br ${tier.color}`
              : "bg-gradient-to-br from-purple-500 to-pink-500"
          )}
          title={tier ? `Level ${level} — ${["Ember","Spark","Flame","Heartbound","Soulbound","Devotion","Eternal","Transcendent","Divine","Ascended"][tier.milestone/10-1]} badge` : `Level ${level}`}
        >
          {/* Tier icon — faint background layer */}
          {tier && (
            <span
              className={cn("absolute select-none leading-none opacity-40", iconSize[size])}
              aria-hidden
            >
              {tier.icon}
            </span>
          )}
          {/* Level number — foreground, centered, bold */}
          <span className={cn("relative z-10 font-black leading-none text-white", numSize[size])}>
            {level}
          </span>
        </div>
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
