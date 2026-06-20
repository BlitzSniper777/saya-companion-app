"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Menu, Bell, Search, User, Settings, LogOut, ChevronDown, Plus, Phone } from "lucide-react";
import { SayaLogo } from "@/components/ui/SayaLogo";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { getInitials } from "@/lib/utils";

const API_URL = () => process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout, coinBalance, subscription, token } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [voiceMinutes, setVoiceMinutes] = useState<number | null>(null);

  const plan = subscription?.plan || "free";
  const hasVoiceAccess = ["gfbf", "vip"].includes(plan);

  useEffect(() => {
    if (!token || !hasVoiceAccess) return;
    fetch(`${API_URL()}/voice/credits`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setVoiceMinutes(data.balance ?? 0); })
      .catch(() => {});
  }, [token, hasVoiceAccess]);

  return (
    <header className="nav-bar">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left - Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="btn-ghost p-2 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SayaLogo size={32} className="rounded-xl" />
            </motion.div>
            <span className="nav-brand text-lg hidden sm:block">Saya</span>
          </div>
        </div>

        {/* Center - Search (optional) */}
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-text placeholder-dim focus:border-purple focus:ring-2 focus:ring-purple/20 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Right - Coins, Voice Credits, Notifications & User Menu */}
        <div className="flex items-center gap-2">
          {/* Voice credits (Romantic/Adult plans only) */}
          {user && hasVoiceAccess && voiceMinutes !== null && (
            <Link
              href="/coins"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card2 hover:bg-card border border-border transition-colors"
            >
              <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="font-bold text-sm text-text">{voiceMinutes}m</span>
              <Plus className="w-3.5 h-3.5 text-purple ml-0.5" />
            </Link>
          )}
          {/* Coin balance */}
          {user && (
            <Link
              href="/coins"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card2 hover:bg-card border border-border transition-colors"
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 inline-block"
                style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
              />
              <span className="font-bold text-sm text-text">{coinBalance.toLocaleString()}</span>
              <Plus className="w-3.5 h-3.5 text-purple ml-0.5" />
            </Link>
          )}
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn-ghost p-2 relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red rounded-full" />
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl shadow-lg py-2"
                >
                  <div className="px-4 py-2 border-b border-border font-semibold">Notifications</div>
                  <div className="px-4 py-4 text-center text-dim text-sm">No notifications yet</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-card2 transition-colors"
              >
                <Avatar name={user.full_name || user.email} size="sm" />
                <span className="hidden sm:block font-medium text-text truncate max-w-[120px]">
                  {user.full_name || "Friend"}
                </span>
                <ChevronDown className="w-4 h-4 text-dim" />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl shadow-lg py-2"
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-dim hover:text-text hover:bg-card2"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link
                      href="/subscription"
                      className="flex items-center gap-2 px-4 py-2 text-dim hover:text-text hover:bg-card2"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Subscription
                    </Link>
                    <hr className="border-border my-2 mx-2" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red hover:bg-red/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}