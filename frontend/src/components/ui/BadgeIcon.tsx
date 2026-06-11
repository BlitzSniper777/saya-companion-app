"use client";

import { cn } from "@/lib/utils";

export interface BadgeIconProps {
  tier: number;      // 10 | 20 | 30 | ... | 100
  size?: number;     // px — default 40
  className?: string;
  showGlow?: boolean;
}

// Each badge: gradient stop colors + SVG symbol path(s)
const TIERS: Record<number, {
  name: string;
  from: string;
  to: string;
  glow: string;
  symbol: React.ReactNode;
}> = {
  10: {
    name: "Ember",
    from: "#f97316", to: "#dc2626", glow: "#f97316",
    symbol: (
      // Flame: outer flame + inner core
      <g>
        <path
          d="M12 3C12 3 7 9 7 13.5C7 17.1 9.2 20 12 20C14.8 20 17 17.1 17 13.5C17 9 12 3 12 3Z"
          fill="rgba(255,255,255,0.9)"
        />
        <path
          d="M12 10C12 10 10 12.5 10 14.5C10 15.9 10.9 17 12 17C13.1 17 14 15.9 14 14.5C14 12.5 12 10 12 10Z"
          fill="rgba(255,220,100,0.95)"
        />
      </g>
    ),
  },
  20: {
    name: "Spark",
    from: "#8b5cf6", to: "#ec4899", glow: "#a855f7",
    symbol: (
      // 4-pointed star / lightning diamond
      <g>
        <path
          d="M12 3L13.8 10.2L21 12L13.8 13.8L12 21L10.2 13.8L3 12L10.2 10.2Z"
          fill="rgba(255,255,255,0.92)"
        />
        <circle cx="12" cy="12" r="2.2" fill="rgba(255,255,255,1)" />
      </g>
    ),
  },
  30: {
    name: "Flame",
    from: "#ec4899", to: "#be123c", glow: "#ec4899",
    symbol: (
      // Triple flame cluster
      <g>
        <path d="M12 4C12 4 8.5 8.5 8.5 12C8.5 14.5 10 16 12 16C14 16 15.5 14.5 15.5 12C15.5 8.5 12 4 12 4Z"
          fill="rgba(255,255,255,0.9)" />
        <path d="M7.5 7C7.5 7 5.5 9.5 5.5 11.5C5.5 13.1 6.6 14.5 8 14.5C8.6 14.5 9.1 14.2 9.4 13.8C8.5 12.5 8.5 10.8 9.2 9.2C8.6 8.3 8 7.5 7.5 7Z"
          fill="rgba(255,255,255,0.6)" />
        <path d="M16.5 7C16.5 7 18.5 9.5 18.5 11.5C18.5 13.1 17.4 14.5 16 14.5C15.4 14.5 14.9 14.2 14.6 13.8C15.5 12.5 15.5 10.8 14.8 9.2C15.4 8.3 16 7.5 16.5 7Z"
          fill="rgba(255,255,255,0.6)" />
        <path d="M12 20L9 17H15Z" fill="rgba(255,255,255,0.7)" />
      </g>
    ),
  },
  40: {
    name: "Heartbound",
    from: "#ef4444", to: "#be123c", glow: "#ef4444",
    symbol: (
      // Heart with a shield outline
      <g>
        <path
          d="M12 19.5C12 19.5 4 14.5 4 9C4 6.2 6.2 4 9 4C10.5 4 11.8 4.7 12 5.5C12.2 4.7 13.5 4 15 4C17.8 4 20 6.2 20 9C20 14.5 12 19.5 12 19.5Z"
          fill="rgba(255,255,255,0.92)"
        />
        <path
          d="M12 16.5C12 16.5 7 13 7 9.8C7 8.3 8.1 7 9.6 7C10.5 7 11.3 7.5 12 8.2C12.7 7.5 13.5 7 14.4 7C15.9 7 17 8.3 17 9.8C17 13 12 16.5 12 16.5Z"
          fill="rgba(255,160,160,0.6)"
        />
      </g>
    ),
  },
  50: {
    name: "Soulbound",
    from: "#06b6d4", to: "#2563eb", glow: "#06b6d4",
    symbol: (
      // Infinity / wave loop
      <g>
        <path
          d="M5 12C5 9.8 6.8 8 9 8C10.4 8 11.5 8.7 12 9.8C12.5 8.7 13.6 8 15 8C17.2 8 19 9.8 19 12C19 14.2 17.2 16 15 16C13.6 16 12.5 15.3 12 14.2C11.5 15.3 10.4 16 9 16C6.8 16 5 14.2 5 12Z"
          fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round"
        />
        <circle cx="9" cy="12" r="1.8" fill="rgba(255,255,255,0.7)" />
        <circle cx="15" cy="12" r="1.8" fill="rgba(255,255,255,0.7)" />
      </g>
    ),
  },
  60: {
    name: "Devotion",
    from: "#f59e0b", to: "#d97706", glow: "#f59e0b",
    symbol: (
      // 8-pointed compass star
      <g>
        <path
          d="M12 3L13.2 10.8L21 12L13.2 13.2L12 21L10.8 13.2L3 12L10.8 10.8Z"
          fill="rgba(255,255,255,0.9)"
        />
        <path
          d="M12 6.5L12.8 10.8L17.5 12L12.8 13.2L12 17.5L11.2 13.2L6.5 12L11.2 10.8Z"
          fill="rgba(255,255,255,0.5)"
        />
        <circle cx="12" cy="12" r="1.5" fill="rgba(255,255,255,1)" />
      </g>
    ),
  },
  70: {
    name: "Eternal",
    from: "#7c3aed", to: "#4338ca", glow: "#7c3aed",
    symbol: (
      // Crescent moon with 3 small stars
      <g>
        <path
          d="M15 5C15 5 9 6 9 12C9 18 15 19 15 19C10 19 6 16 6 12C6 8 10 5 15 5Z"
          fill="rgba(255,255,255,0.92)"
        />
        <circle cx="16" cy="7"  r="1.2" fill="rgba(255,255,255,0.8)" />
        <circle cx="18" cy="12" r="1"   fill="rgba(255,255,255,0.6)" />
        <circle cx="16" cy="17" r="1.2" fill="rgba(255,255,255,0.8)" />
      </g>
    ),
  },
  80: {
    name: "Transcendent",
    from: "#f59e0b", to: "#b45309", glow: "#fbbf24",
    symbol: (
      // 12-ray sunburst
      <g>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = 12 + Math.cos(a) * 4;
          const y1 = 12 + Math.sin(a) * 4;
          const x2 = 12 + Math.cos(a) * 9;
          const y2 = 12 + Math.sin(a) * 9;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={i % 3 === 0 ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.95)" />
        <circle cx="12" cy="12" r="2" fill="rgba(255,220,80,0.9)" />
      </g>
    ),
  },
  90: {
    name: "Divine",
    from: "#fbbf24", to: "#92400e", glow: "#fde047",
    symbol: (
      // Crown with 3 points and gems
      <g>
        <path
          d="M4 18H20V15L17 9L14 13L12 7L10 13L7 9L4 15V18Z"
          fill="rgba(255,255,255,0.92)"
        />
        <circle cx="7"  cy="9.5" r="1.5" fill="rgba(255,220,80,0.9)" />
        <circle cx="12" cy="7"   r="1.8" fill="rgba(255,220,80,0.9)" />
        <circle cx="17" cy="9.5" r="1.5" fill="rgba(255,220,80,0.9)" />
        <rect x="4" y="17" width="16" height="2.5" rx="1" fill="rgba(255,255,255,0.7)" />
      </g>
    ),
  },
  100: {
    name: "Ascended",
    from: "#38bdf8", to: "#1d4ed8", glow: "#7dd3fc",
    symbol: (
      // Hexagonal gemstone with facets
      <g>
        <path
          d="M12 3L19.5 7.5V16.5L12 21L4.5 16.5V7.5Z"
          fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"
        />
        <path d="M12 3L19.5 7.5L12 12Z" fill="rgba(255,255,255,0.4)" />
        <path d="M12 3L4.5 7.5L12 12Z"  fill="rgba(255,255,255,0.25)" />
        <path d="M19.5 7.5L19.5 16.5L12 12Z" fill="rgba(255,255,255,0.15)" />
        <path d="M4.5 7.5L4.5 16.5L12 12Z"   fill="rgba(255,255,255,0.1)" />
        <path d="M19.5 16.5L12 21L12 12Z"    fill="rgba(255,255,255,0.3)" />
        <path d="M4.5 16.5L12 21L12 12Z"     fill="rgba(255,255,255,0.2)" />
        <circle cx="12" cy="12" r="2.5" fill="rgba(255,255,255,0.9)" />
      </g>
    ),
  },
};

export function BadgeIcon({ tier, size = 40, className, showGlow = false }: BadgeIconProps) {
  const def = TIERS[tier];
  if (!def) return null;

  const gradId = `badge-grad-${tier}`;
  const glowId = `badge-glow-${tier}`;
  const padding = size * 0.08;
  const inner = size - padding * 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      title={`${def.name} — Level ${tier}`}
    >
      {showGlow && (
        <div
          className="absolute inset-0 rounded-full blur-md opacity-50"
          style={{ background: def.glow }}
        />
      )}
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={gradId} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor={def.from} />
            <stop offset="100%" stopColor={def.to} />
          </radialGradient>
          {showGlow && (
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>
        {/* Badge background circle */}
        <circle cx="12" cy="12" r="11" fill={`url(#${gradId})`} />
        {/* Subtle inner ring */}
        <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        {/* Tier symbol */}
        {def.symbol}
      </svg>
    </div>
  );
}

export function getBadgeTier(level: number): number | null {
  for (const m of [100, 90, 80, 70, 60, 50, 40, 30, 20, 10]) {
    if (level >= m) return m;
  }
  return null;
}

export function getBadgeName(level: number): string {
  const tier = getBadgeTier(level);
  return tier ? TIERS[tier]?.name ?? "" : "";
}
