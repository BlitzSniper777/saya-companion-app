"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Activity, Users, DollarSign, MessageSquare, TrendingUp, Shield, BarChart2, LineChart, PieChart, Heart, Crown, Flame, ChevronLeft, ChevronRight, Download, Zap, Sparkles as SparklesIcon, Calendar, Clock, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("saya_admin_token") || localStorage.getItem("saya_token");
      const res = await fetch(`${API_URL}/admin/analytics?days=${timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
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
              <Activity className="w-5 h-5 text-white" />
            </motion.div>
            <span className="nav-brand text-lg">Saya Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/admin/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <BarChart2 className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link href="/admin/users" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Users className="w-5 h-5" />
            <span className="font-medium">Users</span>
          </Link>
          <Link href="/admin/analytics" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left bg-card text-text">
            <LineChart className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </Link>
          <Link href="/admin/crises" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Crisis Events</span>
          </Link>
          <Link href="/admin/messages" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Messages</span>
          </Link>
        </nav>
      </aside>

      <main className="ml-64 flex-1 min-h-screen overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4"
          >
            <div>
              <h1 className="text-2xl font-extrabold text-gradient-brand mb-1">Analytics</h1>
              <p className="text-dim">Deep dive into platform metrics and user behavior</p>
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
              <button onClick={fetchAnalytics} disabled={loading} className="btn-secondary">
                <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
          >
            {[
              { label: "DAU", value: analytics?.dau?.[analytics.dau.length - 1]?.count || 0, icon: Activity, color: "purple", change: "+12%" },
              { label: "WAU", value: analytics?.wau?.[analytics.wau.length - 1]?.count || 0, icon: Users, color: "blue", change: "+8%" },
              { label: "MAU", value: analytics?.mau?.[analytics.mau.length - 1]?.count || 0, icon: Target, color: "green", change: "+5%" },
              { label: "Avg Session", value: `${analytics?.avg_session_length || 0} min`, icon: Clock, color: "amber", change: "+2%" },
              { label: "Messages/Day", value: analytics?.messages_per_day?.[analytics.messages_per_day.length - 1]?.count || 0, icon: MessageSquare, color: "pink", change: "+15%" },
            ].map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">{metric.label}</p>
                    <p className={`stat-num ${metric.color === "purple" ? "brand" : metric.color === "green" ? "green" : metric.color === "blue" ? "blue" : metric.color === "amber" ? "amber" : "pink"}`}>
                      {formatNumber(metric.value)}
                    </p>
                    <span className="text-xs text-green-500 font-medium">{metric.change} vs prev</span>
                  </div>
                  <div className={`grad-icon ${metric.color === "purple" ? "" : metric.color === "green" ? "bg-grad-green" : metric.color === "blue" ? "bg-blue-500" : metric.color === "amber" ? "bg-grad-amber" : "bg-pink-500"}`}>
                    <metric.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages Per Day */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-blue-500" />
                  Messages Per Day
                </h3>
                <span className="text-xs text-dim">{analytics?.messages_per_day?.length || 0} data points</span>
              </div>
              <div className="h-80 relative">
                {analytics?.messages_per_day && analytics.messages_per_day.length > 0 ? (
                  <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="msgGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const data = analytics.messages_per_day;
                      const maxCount = Math.max(...data.map((d: any) => d.count), 1);
                      const points = data.map((d: any, i: number) => {
                        const x = (i / Math.max(data.length - 1, 1)) * 100;
                        const y = 100 - (d.count / maxCount) * 80 - 10;
                        return `${x},${y}`;
                      }).join(" ");
                      const areaPoints = ["0,100", ...points.split(" "), "100,100"].join(" ");
                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#msgGradient)" />
                          <polyline points={points} fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="h-full flex items-center justify-center text-dim">No data</div>
                )}
              </div>
            </motion.div>

            {/* Plan Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                Plan Distribution
              </h3>
              <div className="space-y-4">
                {analytics?.plan_distribution && analytics.plan_distribution.length > 0 ? (
                  analytics.plan_distribution.map((item: any, idx: number) => {
                    const total = analytics.plan_distribution.reduce((sum: number, p: any) => sum + p.count, 0);
                    const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
                    const colors: Record<string, string> = { free: "dim", companion: "purple", gfbf: "pink", adult: "red" };
                    return (
                      <motion.div
                        key={item.plan}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        <span className="text-capitalize font-medium text-text w-24">{item.plan}</span>
                        <div className="flex-1 h-3 rounded-full bg-card2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className="h-full rounded-full"
                            style={{ background: `var(--${colors[item.plan] || "purple"})` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-text w-20 text-right">{item.count}</span>
                        <span className="text-xs text-dim w-16">{percentage}%</span>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-dim">No plan data</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Second Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emotion Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Top Emotions
              </h3>
              <div className="space-y-3">
                {analytics?.emotion_tags && analytics.emotion_tags.length > 0 ? (
                  analytics.emotion_tags.slice(0, 15).map((emotion: any, idx: number) => {
                    const maxCount = Math.max(...analytics.emotion_tags.map((e: any) => e.count), 1);
                    const percentage = (emotion.count / maxCount) * 100;
                    return (
                      <motion.div
                        key={emotion.tag}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm font-medium text-text w-28 capitalize">{emotion.tag}</span>
                        <div className="flex-1 h-2 rounded-full bg-card2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.03 }}
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

            {/* DAU/WAU/MAU Trends */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6"
            >
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                User Retention Trends
              </h3>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: "DAU Trend", data: analytics?.dau || [], color: "purple" },
                  { label: "WAU Trend", data: analytics?.wau || [], color: "blue" },
                  { label: "MAU Trend", data: analytics?.mau || [], color: "green" },
                ].map((trend, idx) => (
                  <motion.div
                    key={trend.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}
                  >
                    <p className="text-xs text-dim uppercase tracking-wider mb-3">{trend.label}</p>
                    <div className="h-32 relative">
                      {trend.data.length > 0 ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                          {(() => {
                            const data = trend.data;
                            const maxCount = Math.max(...data.map((d: any) => d.count || 0), 1);
                            const points = data.map((d: any, i: number) => {
                              const x = (i / Math.max(data.length - 1, 1)) * 100;
                              const y = 100 - ((d.count || 0) / maxCount) * 80 - 10;
                              return `${x},${y}`;
                            }).join(" ");
                            const areaPoints = ["0,100", ...points.split(" "), "100,100"].join(" ");
                            const colorMap: Record<string, string> = { purple: "#8b5cf6", blue: "#3b82f6", green: "#10b981" };
                            const color = colorMap[trend.color] || "#8b5cf6";
                            return (
                              <>
                                <polygon points={areaPoints} fill={color} fillOpacity="0.2" />
                                <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
                              </>
                            );
                          })()}
                        </svg>
                      ) : (
                        <div className="h-full flex items-center justify-center text-dim text-xs">No data</div>
                      )}
                    </div>
                    <p className="text-sm font-bold text-text mt-2">
                      {trend.data[trend.data.length - 1]?.count || 0}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Export & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-teal-500" />
              Export & Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button className="btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
              <button className="btn-secondary">
                <BarChart2 className="w-4 h-4 mr-2" />
                Export JSON
              </button>
              <button className="btn-secondary">
                <Calendar className="w-4 h-4 mr-2" />
                Custom Date Range
              </button>
              <button className="btn-secondary">
                <Zap className="w-4 h-4 mr-2" />
                Real-time Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}