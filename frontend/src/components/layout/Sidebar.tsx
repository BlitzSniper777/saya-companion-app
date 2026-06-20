"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { getInitials, formatDate } from "@/lib/utils";
import {
  MessageSquare,
  Heart,
  User,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
  Moon,
  Sun,
  Flame,
  Wallet,
} from "lucide-react";
import { SayaLogo } from "@/components/ui/SayaLogo";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

const navigation = [
  { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
];

export function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onClose,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const { user, companion, subscription, logout, affectionLevel } = useAuth();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const currentPlan = subscription?.plan || "free";
  const planLabels: Record<string, string> = {
    free: "Free",
    companion: "Companion",
    gfbf: "Romantic Companion",
    adult: "Adult Companion",
    vip: "VIP Bundle",
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile backdrop — clicking it closes the drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    <aside
      className={cn(
        "sidebar transition-all duration-300",
        // Mobile: off-screen by default, overlay when open
        mobileOpen ? "translate-x-0 z-50" : "-translate-x-full z-30",
        // Desktop: always visible, z-30
        "lg:translate-x-0 lg:z-30",
        // Width: collapsed on desktop only; mobile open always full
        collapsed && !mobileOpen ? "w-16" : "w-64",
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        <motion.div
          className="flex-shrink-0"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SayaLogo size={32} className="rounded-xl" />
        </motion.div>
        {!collapsed && (
          <span className="nav-brand text-lg ml-3">Saya</span>
        )}
        <button
          onClick={onToggle}
          className="btn-ghost p-2 ml-auto"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar src={user.user_preferences?.avatar_url} name={user.full_name || user.email} size="lg" level={affectionLevel} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text truncate">{user.full_name || "Friend"}</p>
              <p className="text-xs text-dim truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Pill variant="purple" size="sm">
              <Sparkles className="w-3 h-3" />
              {planLabels[currentPlan]}
            </Pill>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                isActive
                  ? "bg-[rgba(139,92,246,0.1)] text-text"
                  : "text-dim hover:text-text hover:bg-card2",
                collapsed && "justify-center"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-purple")} />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}

      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border space-y-2">
        {!collapsed ? (
          <>
            <Link href="/settings" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-dim hover:text-text hover:bg-card2 transition-colors">
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-dim hover:text-text hover:bg-card2 transition-colors"
              >
                <Avatar src={user.user_preferences?.avatar_url} name={user.full_name || user.email} size="sm" level={affectionLevel} />
                <span className="font-medium flex-1 text-left truncate">{user.full_name || "Account"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 glass-card p-2 rounded-xl shadow-lg"
                  >
                    <Link href="/profile" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-dim hover:text-text hover:bg-card2" onClick={() => setShowProfileMenu(false)}>
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link href="/subscription" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-dim hover:text-text hover:bg-card2" onClick={() => setShowProfileMenu(false)}>
                      <CreditCard className="w-4 h-4" />
                      Subscription
                    </Link>
                    <hr className="border-border my-2" />
                    <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red hover:bg-red/10">
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <button onClick={logout} className="btn-ghost p-2 text-red" title="Log Out">
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
    </>
  );
}