"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, Users, MessageSquare, DollarSign, TrendingUp, Shield,
  BarChart2, LineChart, PieChart, Activity, Settings, ArrowLeft, RefreshCw,
  ChevronDown, Search, Filter, Download, Eye, MoreHorizontal, AlertTriangle,
  CheckCircle, XCircle, Crown, Heart, CreditCard, Zap, Mail, Bell
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { adminLogin, adminGetStats, adminGetUsers, adminGetAnalytics } from "@/lib/api";
import type { AdminStats, AdminAnalytics } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

const STAT_CARDS = [
  { key: "total_users", label: "Total Users", icon: Users, color: "purple", format: (v: number) => v.toLocaleString() },
  { key: "active_today", label: "Active Today", icon: Activity, color: "green", format: (v: number) => v.toLocaleString() },
  { key: "messages_today", label: "Messages Today", icon: MessageSquare, color: "blue", format: (v: number) => v.toLocaleString() },
  { key: "mrr", label: "MRR", icon: DollarSign, color: "amber", format: (v: number) => `$${v.toFixed(2)}` },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchData = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        adminGetStats(),
        adminGetAnalytics(),
      ]);
      setStats(statsRes);
      setAnalytics(analyticsRes);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 fixed left-0 top-0 h-screen z-30 flex flex-col" style={{background: '#06060f', borderRight: '1px solid rgba(139,92,246,0.18)'}}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
            >
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            <span className="nav-brand text-lg">Saya Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-2 mb-4">
            <span className="section-label">Dashboard</span>
          </div>
          <Link
            href="/admin/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left bg-card text-text"
          >
            <BarChart2 className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link
            href="/admin/users"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Users</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2"
          >
            <LineChart className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </Link>
          <Link
            href="/admin/crises"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2"
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Crisis Events</span>
          </Link>
          <Link
            href="/admin/messages"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Messages</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-border">
            <div className="px-2 mb-4">
              <span className="section-label">System</span>
            </div>
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Saya</span>
            </Link>
          </div>
        </nav>
      </aside>

      <main className="ml-64 flex-1 min-h-screen overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4"
          >
            <div>
              <h1 className="text-2xl font-extrabold text-gradient-brand mb-1">Admin Dashboard</h1>
              <p className="text-dim">Platform overview and key metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="input-field w-auto py-2 px-3 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-secondary"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </motion.div>

          {/* Stat Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STAT_CARDS.map((stat) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * STAT_CARDS.indexOf(stat) }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-dim uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className={`stat-num ${stat.color === "purple" ? "brand" : stat.color === "green" ? "green" : stat.color === "blue" ? "blue" : "amber"}`}>
                      {stats ? stat.format(stats[stat.key as keyof AdminStats] as number) : "—"}
                    </p>
                  </div>
                  <div className={`grad-icon ${stat.color === "purple" ? "" : stat.color === "green" ? "bg-grad-green" : stat.color === "blue" ? "bg-blue-500" : "bg-grad-amber"}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Plan Distribution & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                Subscription Distribution
              </h3>
              <div className="space-y-4">
                {stats?.subscriptions_by_plan && Object.entries(stats.subscriptions_by_plan).map(([plan, count]) => {
                  const total = Object.values(stats.subscriptions_by_plan).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
                  const planColors: Record<string, string> = {
                    free: "dim",
                    companion: "purple",
                    gfbf: "pink",
                    adult: "red",
                  };
                  const color = planColors[plan] || "dim";
                  return (
                    <div key={plan} className="flex items-center gap-4">
                      <span className="text-capitalize font-medium text-text w-24">{plan}</span>
                      <div className="flex-1 h-2 rounded-full bg-card2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ background: `var(--${color})` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-text w-20 text-right">{count}</span>
                      <span className="text-xs text-dim w-16">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 space-y-3"
            >
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Quick Actions
              </h3>
              <Link href="/admin/users" className="btn-secondary w-full justify-start gap-3">
                <Users className="w-5 h-5" />
                <span>Manage Users</span>
              </Link>
              <Link href="/admin/analytics" className="btn-secondary w-full justify-start gap-3">
                <LineChart className="w-5 h-5" />
                <span>View Analytics</span>
              </Link>
              <Link href="/admin/crises" className="btn-secondary w-full justify-start gap-3">
                <Shield className="w-5 h-5" />
                <span>Review Crises</span>
              </Link>
              <Link href="/admin/messages" className="btn-secondary w-full justify-start gap-3">
                <MessageSquare className="w-5 h-5" />
                <span>View Messages</span>
              </Link>
              <button className="btn-secondary w-full justify-start gap-3">
                <Download className="w-5 h-5" />
                <span>Export Data</span>
              </button>
              <button className="btn-secondary w-full justify-start gap-3">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages per Day */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <LineChart className="w-5 h-5 text-blue-500" />
                Messages per Day
              </h3>
              <div className="h-64 relative">
                {analytics?.messages_per_day && analytics.messages_per_day.length > 0 ? (
                  <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const data = analytics.messages_per_day;
                      const maxCount = Math.max(...data.map(d => d.count), 1);
                      const pointsArray = data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 100;
                        const y = 100 - (d.count / maxCount) * 80 - 10;
                        return `${x},${y}`;
                      });
                      const points = pointsArray.join(" ");
                      const areaPoints = ["0,100", ...pointsArray, "100,100"].join(" ");
                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#chartGradient)" />
                          <polyline points={points} fill="none" stroke="#8b5cf6" strokeWidth="2" />
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="h-full flex items-center justify-center text-dim">
                    No data available
                  </div>
                )}
              </div>
            </motion.div>

            {/* Emotion Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Top Emotions
              </h3>
              <div className="space-y-3">
                {analytics?.emotion_tags && analytics.emotion_tags.length > 0 ? (
                  analytics.emotion_tags.slice(0, 10).map((emotion, idx) => {
                    const maxCount = Math.max(...analytics.emotion_tags.map(e => e.count), 1);
                    const percentage = (emotion.count / maxCount) * 100;
                    return (
                      <motion.div
                        key={emotion.tag}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm font-medium text-text w-24 capitalize">{emotion.tag}</span>
                        <div className="flex-1 h-2 rounded-full bg-card2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05 }}
                            className="h-full rounded-full bg-grad-brand"
                          />
                        </div>
                        <span className="text-sm font-bold text-text w-16 text-right">{emotion.count}</span>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-dim">No emotion data</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-500" />
                Recent Activity
              </h3>
              <Link href="/admin/users" className="btn-ghost text-sm">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: "2 min ago", event: "New Registration", user: "sarah@example.com", plan: "Free", detail: "Completed onboarding" },
                    { time: "15 min ago", event: "Subscription Upgrade", user: "mike@example.com", plan: "Companion", detail: "Monthly billing started" },
                    { time: "1 hour ago", event: "Crisis Detected", user: "alex@example.com", plan: "GF/BF", detail: "Resources provided" },
                    { time: "3 hours ago", event: "New Registration", user: "emma@example.com", plan: "Free", detail: "Email verified" },
                    { time: "5 hours ago", event: "Subscription Upgrade", user: "john@example.com", plan: "GF/BF", detail: "Lifetime purchase" },
                  ].map((row, idx) => (
                    <tr key={idx} className={`${idx % 2 === 0 ? "bg-card/50" : ""}`}>
                      <td className="text-xs text-dim">{row.time}</td>
                      <td>
                        <span className={`badge ${row.event.includes("Crisis") ? "badge-red" : row.event.includes("Upgrade") ? "badge-green" : "badge-purple"}`}>
                          {row.event}
                        </span>
                      </td>
                      <td className="text-sm text-text">{row.user}</td>
                      <td>
                        <span className={`pill ${row.plan === "Free" ? "pill-dim" : row.plan === "Companion" ? "pill-purple" : row.plan === "GF/BF" ? "pill-pink" : "pill-red"}`}>
                          {row.plan}
                        </span>
                      </td>
                      <td className="text-sm text-dim">{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              System Health
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "API Status", value: "Healthy", status: "good", icon: CheckCircle },
                { label: "Database", value: "Connected", status: "good", icon: CheckCircle },
                { label: "Nous Portal", value: "Authenticated", status: "good", icon: CheckCircle },
                { label: "Stripe", value: "Configured", status: "warning", icon: AlertTriangle },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-4 text-center" style={{background: 'rgba(17,17,24,0.8)'}}
                >
                  <item.icon className={`w-8 h-8 mx-auto mb-3 ${item.status === "good" ? "text-green-500" : "text-amber-500"}`} />
                  <p className="text-xs text-dim uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="font-bold text-text">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}