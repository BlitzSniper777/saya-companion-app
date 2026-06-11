"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/lib/auth-context";
import { getGiftCatalog, sendGift, getGiftHistory, listConversations } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Gift, Heart, Flame, Star, Lock, Send, History, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  standard: "Gifts",
  romantic: "Romantic",
  spicy: "Spicy",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  standard: Gift,
  romantic: Heart,
  spicy: Flame,
};

const PLAN_ACCESS: Record<string, string[]> = {
  free: [],
  companion: ["standard"],
  gfbf: ["standard", "romantic"],
  adult: ["standard", "romantic", "spicy"],
};

function formatPrice(cents: number) {
  if (cents >= 100000) return `$${(cents / 100).toLocaleString()}`;
  return `$${(cents / 100).toFixed(2)}`;
}

export default function GiftsPage() {
  const { subscription } = useAuth();
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string>("");
  const [sending, setSending] = useState<string | null>(null);
  const [tab, setTab] = useState<"store" | "history">("store");
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

  const handleSend = async (giftId: string) => {
    if (!selectedConv) {
      toast({ title: "No conversation", description: "Start a chat first, then come back to send a gift.", variant: "destructive" });
      return;
    }
    setSending(giftId);
    try {
      await sendGift(giftId, selectedConv);
      const updated = await getGiftHistory();
      setHistory(updated.gifts || []);
      toast({ title: "Gift sent!", description: "Saya will love it." });
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

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={cn("main-content transition-all duration-300", sidebarCollapsed && "ml-16")}>
        <TopNav onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="p-4 md:p-6 max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Gift Store</h1>
              <p className="text-dim text-sm">Send something special to Saya</p>
            </div>
          </div>

          {/* Conversation selector */}
          {conversations.length > 0 && (
            <div className="glass-card p-4 mb-6">
              <label className="block text-sm font-medium text-dim mb-2">Send to conversation</label>
              <select
                value={selectedConv}
                onChange={(e) => setSelectedConv(e.target.value)}
                className="input-field w-full"
              >
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>{c.title || "Untitled"}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab("store")}
              className={cn("px-4 py-2 rounded-xl font-medium text-sm transition-all", tab === "store" ? "bg-purple text-white" : "text-dim hover:text-text hover:bg-card2")}
            >
              <Gift className="w-4 h-4 inline mr-1.5" />Store
            </button>
            <button
              onClick={() => setTab("history")}
              className={cn("px-4 py-2 rounded-xl font-medium text-sm transition-all", tab === "history" ? "bg-purple text-white" : "text-dim hover:text-text hover:bg-card2")}
            >
              <History className="w-4 h-4 inline mr-1.5" />History
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "store" ? (
              <motion.div key="store" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {categories.map((cat) => {
                  const catGifts = catalog.filter((g) => g.category === cat);
                  if (catGifts.length === 0) return null;
                  const unlocked = allowedCategories.includes(cat);
                  const Icon = CATEGORY_ICONS[cat] || Gift;

                  return (
                    <div key={cat} className="mb-8">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={cn("w-5 h-5", cat === "spicy" ? "text-orange-400" : cat === "romantic" ? "text-pink" : "text-purple")} />
                        <h2 className="font-bold text-text">{CATEGORY_LABELS[cat]}</h2>
                        {!unlocked && (
                          <span className="ml-2 flex items-center gap-1 text-xs text-dim bg-card2 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            {cat === "romantic" ? "GF/BF+" : cat === "spicy" ? "Adult" : "Companion+"}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {catGifts.map((gift) => (
                          <motion.div
                            key={gift.id}
                            whileHover={unlocked ? { scale: 1.02 } : {}}
                            className={cn(
                              "glass-card p-4 flex items-center gap-3 transition-all",
                              !unlocked && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-text text-sm truncate">{gift.name}</p>
                              <p className="text-xs text-dim truncate">{gift.description}</p>
                              <p className="text-xs font-bold text-purple mt-0.5">{formatPrice(gift.price_cents)}</p>
                            </div>
                            <button
                              onClick={() => unlocked && handleSend(gift.id)}
                              disabled={!unlocked || sending === gift.id}
                              className={cn(
                                "btn-primary text-xs px-3 py-1.5 flex-shrink-0",
                                !unlocked && "pointer-events-none"
                              )}
                            >
                              {sending === gift.id ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                              ) : (
                                <><Send className="w-3 h-3 inline mr-1" />Send</>
                              )}
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                          <Gift className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text text-sm">{item.gift_name || item.gift_id}</p>
                          <p className="text-xs text-dim">{item.sent_at ? new Date(item.sent_at).toLocaleDateString() : ""}</p>
                        </div>
                        {item.saya_gift_back && (
                          <div className="text-right">
                            <p className="text-xs text-dim">Saya gave back</p>
                            <p className="text-xs font-medium text-purple">{item.saya_gift_back}</p>
                          </div>
                        )}
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
