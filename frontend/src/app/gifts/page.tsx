"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/lib/auth-context";
import { getGiftCatalog, sendGift, getGiftHistory, listConversations } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Gift, Heart, Flame, Lock, Send, History, ShoppingBag, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const TIER_ORDER = ["tiny", "small", "medium", "large", "epic"];
const TIER_LABELS: Record<string, string> = {
  tiny:   "Tiny",
  small:  "Small",
  medium: "Medium",
  large:  "Large",
  epic:   "Epic",
};

const CATEGORY_LABELS: Record<string, string> = {
  standard: "Gifts",
  romantic: "Romantic",
  spicy:    "Spicy",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  standard: Gift,
  romantic: Heart,
  spicy:    Flame,
};

const PLAN_ACCESS: Record<string, string[]> = {
  free:      [],
  companion: ["standard"],
  gfbf:      ["standard", "romantic"],
  adult:     ["standard", "romantic", "spicy"],
};

export default function GiftsPage() {
  const { subscription, refreshAffection, refreshCoins, coinBalance } = useAuth();
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string>("");
  const [sending, setSending] = useState<string | null>(null);
  const [tab, setTab] = useState<"store" | "history">("store");
  const [activeCategory, setActiveCategory] = useState<string>("standard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const plan = subscription?.plan || "free";
  const allowedCategories = PLAN_ACCESS[plan] || [];

  useEffect(() => {
    Promise.all([
      getGiftCatalog().then((r) => setCatalog(r.gifts || [])),
      getGiftHistory().then((r) => setHistory(r.gifts || [])),
      listConversations().then((convs) => {
        setConversations(convs);
        if (convs.length > 0) setSelectedConv(convs[0].id);
      }),
    ])
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSend = async (giftId: string, coinPrice: number) => {
    if (!selectedConv) {
      toast({ title: "No conversation", description: "Start a chat first, then come back to send a gift.", variant: "destructive" });
      return;
    }
    if (coinBalance < coinPrice) {
      toast({
        title: "Not enough coins",
        description: `You need ${coinPrice} coins but have ${coinBalance}. Top up to continue.`,
        variant: "destructive",
      });
      return;
    }
    setSending(giftId);
    try {
      const res = await sendGift(giftId, selectedConv);
      const updated = await getGiftHistory();
      setHistory(updated.gifts || []);
      await Promise.all([refreshAffection(), refreshCoins()]);
      toast({ title: "Gift sent! 🎁", description: `Saya loved it. ${res.saya_reply || ""}` });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to send gift", variant: "destructive" });
    } finally {
      setSending(null);
    }
  };

  const categories = ["standard", "romantic", "spicy"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group catalog by tier within active category
  const catGifts = catalog.filter((g) => g.category === activeCategory);
  const byTier = TIER_ORDER.map((tier) => ({
    tier,
    gifts: catGifts.filter((g) => g.tier === tier),
  })).filter((g) => g.gifts.length > 0);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={cn("main-content transition-all duration-300", sidebarCollapsed && "ml-16")}>
        <TopNav onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="p-4 md:p-6 max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text">Gift Store</h1>
                <p className="text-dim text-sm">Send something special to Saya</p>
              </div>
            </div>
            {/* Coin balance chip */}
            <Link href="/coins" className="flex items-center gap-1.5 px-3 py-2 glass-card rounded-xl hover:border-purple border border-transparent transition-all">
              <span className="text-lg">🪙</span>
              <span className="font-bold text-text">{coinBalance.toLocaleString()}</span>
              <span className="text-xs text-purple font-medium">+ Top Up</span>
            </Link>
          </div>

          {/* Conversation selector */}
          {conversations.length > 0 && (
            <div className="glass-card p-4 mb-6">
              <label className="block text-sm font-medium text-dim mb-2">Send to conversation</label>
              <select value={selectedConv} onChange={(e) => setSelectedConv(e.target.value)} className="input-field w-full">
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>{c.title || "Untitled"}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab("store")} className={cn("px-4 py-2 rounded-xl font-medium text-sm transition-all", tab === "store" ? "bg-purple text-white" : "text-dim hover:text-text hover:bg-card2")}>
              <Gift className="w-4 h-4 inline mr-1.5" />Store
            </button>
            <button onClick={() => setTab("history")} className={cn("px-4 py-2 rounded-xl font-medium text-sm transition-all", tab === "history" ? "bg-purple text-white" : "text-dim hover:text-text hover:bg-card2")}>
              <History className="w-4 h-4 inline mr-1.5" />History
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "store" ? (
              <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {/* Category tabs */}
                <div className="flex gap-2 mb-5">
                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat] || Gift;
                    const unlocked = allowedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => unlocked && setActiveCategory(cat)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all",
                          activeCategory === cat && unlocked ? "bg-purple/20 text-purple border border-purple/30" : "text-dim hover:text-text hover:bg-card2",
                          !unlocked && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {CATEGORY_LABELS[cat]}
                        {!unlocked && <Lock className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>

                {/* Free plan banner */}
                {plan === "free" && (
                  <div className="glass-card p-5 text-center">
                    <Gift className="w-10 h-10 mx-auto mb-3 text-purple opacity-50" />
                    <p className="font-semibold text-text mb-1">Upgrade to send gifts</p>
                    <p className="text-dim text-sm mb-3">Companion plan and above can send gifts to Saya</p>
                    <Link href="/subscription" className="btn-primary text-sm px-5 py-2">View Plans</Link>
                  </div>
                )}

                {/* Gifts by tier */}
                {byTier.map(({ tier, gifts }) => (
                  <div key={tier} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-dim uppercase tracking-wider">{TIER_LABELS[tier]}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {gifts.map((gift) => {
                        const canAfford = coinBalance >= gift.coin_price;
                        return (
                          <motion.div
                            key={gift.id}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                              "glass-card p-3 flex flex-col items-center gap-2 text-center transition-all",
                              !canAfford && "opacity-60"
                            )}
                          >
                            <span className="text-3xl">{gift.emoji}</span>
                            <div>
                              <p className="font-semibold text-text text-xs leading-tight">{gift.name}</p>
                              <p className="text-dim text-xs mt-0.5 line-clamp-2">{gift.description}</p>
                            </div>
                            <button
                              onClick={() => handleSend(gift.id, gift.coin_price)}
                              disabled={sending === gift.id || !canAfford}
                              className={cn(
                                "w-full flex items-center justify-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg transition-all",
                                canAfford
                                  ? "bg-purple/20 hover:bg-purple text-purple hover:text-white border border-purple/30"
                                  : "bg-card2 text-dim cursor-not-allowed"
                              )}
                            >
                              {sending === gift.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>🪙</span>
                                  <span>{gift.coin_price.toLocaleString()}</span>
                                </>
                              )}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {byTier.length === 0 && plan !== "free" && (
                  <div className="text-center py-12 text-dim">
                    <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No gifts in this category yet.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {history.length === 0 ? (
                  <div className="text-center py-16 text-dim">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No gifts sent yet. Be the first to spoil Saya!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item, i) => (
                      <div key={i} className="glass-card p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl">
                          {GIFT_EMOJI_MAP[item.gift_id] || "🎁"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text text-sm">{item.gift_name || item.gift_id}</p>
                          <p className="text-xs text-dim">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-yellow-400 flex items-center gap-0.5">
                            <span>🪙</span>{item.amount_cents?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// emoji lookup for history
const GIFT_EMOJI_MAP: Record<string, string> = {
  rose: "🌹", heart: "❤️", shooting_star: "🌠", virtual_hug: "🤗", blown_kiss: "😘",
  sunflower: "🌻", morning_coffee: "☕", goodnight_moon: "🌙", cake_slice: "🍰", love_song: "🎵",
  teddy_bear: "🧸", heart_balloon: "🎈", flower_bouquet: "💐", love_letter: "💌", tiara: "👑",
  perfume_bottle: "🌸", heart_explosion: "💥", angel_wings: "🕊️", crystal_heart: "💎",
  golden_bouquet: "🌷", wish_lantern: "🏮", enchanted_rose: "🌹", heart_cascade: "💞",
  moonbeam: "🌟", diamond_dreams: "✨", fireworks_show: "🎆", universe_gift: "🌌",
  eternal_bond: "♾️", starfall: "🌠", love_potion: "🧪", heart_locket: "🔐",
  midnight_kiss: "💋", northern_lights: "🌌", diamond_ring: "💍", fire_gift: "🔥",
  hot_pepper: "🌶️", secret_whisper: "🤫", forbidden_fruit: "🍎", burning_desire: "💥",
  soul_storm: "⚡",
};
