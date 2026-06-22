"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, BarChart2, Users, LineChart, MessageSquare, ArrowLeft, Menu, X,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Overview",      icon: BarChart2     },
  { href: "/admin/users",     label: "Users",          icon: Users         },
  { href: "/admin/analytics", label: "Analytics",     icon: LineChart     },
  { href: "/admin/crises",    label: "Crisis Events", icon: Shield        },
  { href: "/admin/messages",  label: "Messages",      icon: MessageSquare },
];

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between h-14 px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="nav-brand text-lg">Saya Admin</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-dim hover:text-text p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-2 mb-4 section-label">Dashboard</p>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                active ? "bg-card text-text" : "text-dim hover:text-text hover:bg-card2"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-border">
          <Link
            href="/"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-dim hover:text-text hover:bg-card2"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="font-medium">Back to Saya</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-64 fixed left-0 top-0 h-screen z-30 flex-col"
        style={{ background: "#06060f", borderRight: "1px solid rgba(139,92,246,0.18)" }}
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-screen w-72 z-50 flex flex-col lg:hidden"
              style={{ background: "#06060f", borderRight: "1px solid rgba(139,92,246,0.18)" }}
            >
              <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <div
          className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 border-b border-border"
          style={{ background: "#06060f" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="text-dim hover:text-text p-1"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
            >
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="nav-brand text-base">Saya Admin</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
