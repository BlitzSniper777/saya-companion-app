"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { getAffection, getAffectionLeaderboard } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Heart, Star, Trophy, Zap, Lock, ChevronRight, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BadgeIcon } from "@/components/ui/BadgeIcon";

function LevelBadge({ badge, earned }: { badge: any; earned: boolean }) {
  return (
    <motion.div
      whileHover={earned ? { scale: 1.05 } : {}}
      className={cn(
        "glass-card p-4 flex flex-col items-center gap-2 text-center relative overflow-hidden",
        !earned && "opacity-40"
      )}
    >
      {!earned && <Lock className="absolute top-2 right-2 w-3 h-3 text-dim" />}
      <div className="relative">
        {earned ? (
          <BadgeIcon tier={badge.level} size={56} showGlow={true} />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-card2 flex items-center justify-center">
            <Lock className="w-6 h-6 text-dim opacity-40" />
          </div>
        )}
      </div>
      <div>
        <p className={cn("font-bold text-sm", earned ? "text-text" : "text-dim")}>
          {badge.name}
        </p>
        <p className="text-xs text-dim">Level {badge.level}</p>
      </div>
      {earned && (
        <p className="text-xs text-dim leading-snug">{badge.feature_name}</p>
      )}
    </motion.div>
  );
}

function FeatureRow({ feature, earned }: { feature: any; earned: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 py-2.5 border-b border-border last:border-0",
      !earned && "opacity-40"
    )}>
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold",
        feature.is_badge
          ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
          : earned ? "bg-[rgba(139,92,246,0.15)] text-purple" : "bg-card2 text-dim"
      )}>
        {feature.is_badge ? "★" : feature.level}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", earned ? "text-text" : "text-dim")}>
          {feature.is_badge ? `${feature.badge_name}: ` : ""}{feature.name}
        </p>
        <p className="text-xs text-dim truncate">{feature.desc}</p>
      </div>
      {earned && <Zap className="w-3 h-3 text-purple flex-shrink-0" />}
      {!earned && <Lock className="w-3 h-3 text-dim flex-shrink-0" />}
    </div>
  );
}

export default function AffectionPage() {
  const { toast } = useToast();
  const [affection, setAffection] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "features" | "leaderboard">("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  useEffect(() => {
    Promise.all([
      getAffection().then(setAffection),
      getAffectionLeaderboard().then((r) => setLeaderboard(r.leaderboard || [])),
    ])
      .catch(() => toast({ title: "Could not load affection data", variant: "destructive" }))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const level = affection?.level ?? 1;
  const pct = affection?.progress_pct ?? 0;
  const nextBadge = affection?.next_badge;
  const earnedBadges = affection?.earned_badges ?? [];
  const allBadges = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((lvl) =>
    affection?.earned_badges?.find((b: any) => b.level === lvl) ||
    (affection?.next_badge?.level === lvl ? { ...affection.next_badge, level: lvl, _upcoming: true } : { level: lvl, _placeholder: true })
  );
  const unlockedFeatures: any[] = affection?.unlocked_features ?? [];
  const allFeatures: any[] = affection?.unlocked_features ?? [];

  // Build all 100 levels for the "features" tab (we only have unlocked ones from API,
  // but that's enough — just show unlocked + next 5 upcoming)
  const nextFive = Array.from({ length: 5 }, (_, i) => level + 1 + i).filter((l) => l <= 100);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={cn("main-content transition-all duration-300", sidebarCollapsed && "ml-16")}>
        <TopNav onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="p-4 md:p-6 max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-text">Bond Level</h1>
              <p className="text-dim text-sm">Your connection with Saya</p>
            </div>
          </div>

          {/* Level card */}
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-5xl font-black text-text">{level}</span>
                  {affection?.current_badge && (
                    <span className="text-3xl">{affection.current_badge.icon}</span>
                  )}
                </div>
                <p className="text-dim text-sm mt-1">
                  {affection?.current_level_name || `Level ${level}`}
                  {affection?.is_badge_level && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple to-pink text-white">
                      Badge Earned!
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple">{(affection?.total_points ?? 0).toLocaleString()}</p>
                <p className="text-xs text-dim">affection points</p>
              </div>
            </div>

            {/* Progress bar */}
            {level < 100 && (
              <>
                <div className="flex justify-between text-xs text-dim mb-1.5">
                  <span>{affection?.points_in_level ?? 0} pts</span>
                  <span>{affection?.points_to_next_level ?? 0} pts to level {level + 1}</span>
                </div>
                <div className="h-3 rounded-full bg-card2 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between text-xs text-dim mt-1">
                  <span>{pct.toFixed(1)}% complete</span>
                  {nextBadge && (
                    <span className="text-purple">
                      {nextBadge.icon} {nextBadge.name} at level {nextBadge.level}
                    </span>
                  )}
                </div>
              </>
            )}
            {level === 100 && (
              <div className="text-center py-2">
                <p className="text-lg font-bold bg-gradient-to-r from-purple to-pink bg-clip-text text-transparent">
                  💎 Ascended — Maximum Bond Reached
                </p>
              </div>
            )}

            {/* Points guide */}
            <div className="mt-4 pt-4 border-t border-border text-xs text-dim flex items-center gap-2">
              <Zap className="w-3 h-3 text-purple flex-shrink-0" />
              <span>Send gifts to earn affection points — <strong className="text-text">$1 spent = 10 points</strong></span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["overview", "features", "leaderboard"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium text-sm capitalize transition-all",
                  tab === t ? "bg-purple text-white" : "text-dim hover:text-text hover:bg-card2"
                )}
              >
                {t === "overview" && <Star className="w-4 h-4 inline mr-1.5" />}
                {t === "features" && <Zap className="w-4 h-4 inline mr-1.5" />}
                {t === "leaderboard" && <Trophy className="w-4 h-4 inline mr-1.5" />}
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* Overview — badges grid */}
            {tab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="font-bold text-text mb-3">Badges ({earnedBadges.length}/10)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((badgeLevel) => {
                    const earned = earnedBadges.find((b: any) => b.level === badgeLevel);
                    const upcoming = !earned && nextBadge?.level === badgeLevel;
                    const placeholder = !earned && !upcoming;
                    const badge = earned || (upcoming ? nextBadge : null);

                    return (
                      <div key={badgeLevel}>
                        {badge ? (
                          <LevelBadge badge={{ ...badge, level: badgeLevel }} earned={!!earned} />
                        ) : (
                          <div className="glass-card p-4 flex flex-col items-center gap-2 opacity-20">
                            <BadgeIcon tier={badgeLevel} size={56} />
                            <p className="text-xs text-dim">Level {badgeLevel}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Current + next unlock */}
                {affection?.current_level_unlock && (
                  <div className="glass-card p-4 mb-3">
                    <p className="text-xs text-dim mb-1">Current Level Unlock</p>
                    <p className="font-semibold text-text text-sm">
                      {affection.current_level_unlock.name || affection.current_level_unlock.feature_name}
                    </p>
                    <p className="text-xs text-dim">
                      {affection.current_level_unlock.desc || affection.current_level_unlock.feature_desc}
                    </p>
                  </div>
                )}
                {affection?.next_level_unlock && level < 100 && (
                  <div className="glass-card p-4 border border-purple/20">
                    <p className="text-xs text-purple mb-1">Next Unlock at Level {level + 1}</p>
                    <p className="font-semibold text-text text-sm">
                      {affection.next_level_unlock.name || affection.next_level_unlock.feature_name}
                    </p>
                    <p className="text-xs text-dim">
                      {affection.next_level_unlock.desc || affection.next_level_unlock.feature_desc}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Features tab */}
            {tab === "features" && (
              <motion.div key="features" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="glass-card p-4">
                  <p className="text-xs text-dim mb-3">
                    {unlockedFeatures.length} features unlocked · {100 - unlockedFeatures.length} remaining
                  </p>
                  {(showAllFeatures ? unlockedFeatures : unlockedFeatures.slice(-10)).map((f: any) => (
                    <FeatureRow key={f.key} feature={f} earned={true} />
                  ))}
                  {!showAllFeatures && unlockedFeatures.length > 10 && (
                    <button
                      onClick={() => setShowAllFeatures(true)}
                      className="w-full mt-3 text-xs text-purple hover:text-pink flex items-center justify-center gap-1"
                    >
                      Show all {unlockedFeatures.length} unlocked features <ChevronRight className="w-3 h-3" />
                    </button>
                  )}

                  {/* Upcoming next 5 */}
                  {level < 100 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-dim mb-2">Coming up...</p>
                      {nextFive.map((lvl) => (
                        <div key={lvl} className="flex items-center gap-3 py-2 opacity-40">
                          <div className="w-7 h-7 rounded-lg bg-card2 flex items-center justify-center text-xs font-bold text-dim">
                            {lvl}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-dim">Level {lvl} unlock</p>
                          </div>
                          <Lock className="w-3 h-3 text-dim" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Leaderboard tab */}
            {tab === "leaderboard" && (
              <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="glass-card p-4">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12 text-dim">
                      <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No rankings yet. Send gifts to climb the board!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((entry: any) => (
                        <div
                          key={entry.rank}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl",
                            entry.is_me ? "bg-[rgba(139,92,246,0.1)] border border-purple/20" : "hover:bg-card2"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0",
                            entry.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" :
                            entry.rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                            entry.rank === 3 ? "bg-gradient-to-br from-amber-600 to-yellow-700 text-white" :
                            "bg-card2 text-dim"
                          )}>
                            {entry.rank === 1 ? "👑" : entry.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-semibold text-sm truncate", entry.is_me ? "text-purple" : "text-text")}>
                              {entry.name}{entry.is_me && " (you)"}
                            </p>
                            <p className="text-xs text-dim">
                              {entry.badge ? `${entry.badge.icon} ${entry.badge.name}` : `Level ${entry.level}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-purple">{entry.level}</p>
                            <p className="text-xs text-dim">{entry.points.toLocaleString()} pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
