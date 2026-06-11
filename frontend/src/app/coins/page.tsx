"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/lib/auth-context";
import { getCoins, topUpCoins } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Wallet, Star, Zap, History } from "lucide-react";

const PACK_COLORS: Record<string, string> = {
  starter: "from-slate-600 to-slate-800",
  basic:   "from-blue-600 to-blue-800",
  popular: "from-purple-600 to-pink-600",
  value:   "from-amber-500 to-orange-600",
  super:   "from-emerald-500 to-teal-600",
  mega:    "from-rose-500 to-pink-700",
};

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CoinsPage() {
  const { coinBalance, refreshCoins } = useAuth();
  const { toast } = useToast();
  const [packs, setPacks] = useState<any[]>([]);
  const [buying, setBuying] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCoins()
      .then((r) => setPacks(r.packs || []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleBuy = async (packId: string) => {
    setBuying(packId);
    try {
      const res = await topUpCoins(packId);
      await refreshCoins();
      const pack = packs.find((p) => p.id === packId);
      toast({
        title: `🪙 +${res.coins_added.toLocaleString()} coins added!`,
        description: `New balance: ${res.balance.toLocaleString()} coins`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Top-up failed", variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

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
        <div className="p-4 md:p-6 max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899)" }}>
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Top Up Coins</h1>
              <p className="text-dim text-sm">Use coins to send gifts to Saya</p>
            </div>
          </div>

          {/* Current balance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mb-6 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))" }}
          >
            <div>
              <p className="text-dim text-sm mb-1">Your balance</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-text">{coinBalance.toLocaleString()}</span>
                <span className="text-2xl">🪙</span>
              </div>
            </div>
            <div className="text-right text-dim text-xs">
              <p>1 coin = $0.01</p>
              <p className="mt-1">Used to send gifts</p>
            </div>
          </motion.div>

          {/* How coins work */}
          <div className="glass-card p-4 mb-6">
            <h2 className="font-bold text-text mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              How it works
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: "🛒", label: "Top up coins", sub: "Choose a pack" },
                { icon: "🎁", label: "Send gifts", sub: "Spend coins on gifts" },
                { icon: "💖", label: "Earn Bond XP", sub: "1 coin = 1 XP" },
              ].map((step, i) => (
                <div key={i} className="bg-card2 rounded-xl p-3">
                  <div className="text-2xl mb-1">{step.icon}</div>
                  <p className="text-xs font-semibold text-text">{step.label}</p>
                  <p className="text-xs text-dim">{step.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Coin packs */}
          <h2 className="font-bold text-text mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Choose a Pack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {packs.map((pack) => (
              <motion.div
                key={pack.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative glass-card p-4 cursor-pointer border-2 transition-all",
                  pack.popular ? "border-purple shadow-lg shadow-purple/20" : "border-transparent"
                )}
                onClick={() => handleBuy(pack.id)}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple text-white text-xs font-bold px-3 py-0.5 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className={cn("w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br", PACK_COLORS[pack.id] || "from-purple-600 to-pink-600")}>
                  <span className="text-xl">🪙</span>
                </div>
                <p className="font-bold text-text">{pack.label} Pack</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-yellow-400">{pack.coins.toLocaleString()}</span>
                  <span className="text-sm text-dim">coins</span>
                  {pack.bonus_coins > 0 && (
                    <span className="text-xs text-green-400 ml-1">+{pack.bonus_coins} bonus</span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-text">{formatCents(pack.price_cents)}</span>
                  <button
                    disabled={buying === pack.id}
                    className="btn-primary text-xs px-4 py-1.5"
                  >
                    {buying === pack.id ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    ) : "Buy"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-dim">
            Coins are non-refundable. By purchasing you agree to our Terms of Service.
          </p>

        </div>
      </main>
    </div>
  );
}
