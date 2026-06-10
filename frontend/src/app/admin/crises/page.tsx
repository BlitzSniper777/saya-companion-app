"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Shield, AlertTriangle, CheckCircle, XCircle, Eye, MoreHorizontal, Mail, User, Clock, Search, Filter, ChevronLeft, ChevronRight, Flag, MessageSquare, Heart, Brain, Zap, Download, Bell, Shield as ShieldIcon, X, Activity, Users, LineChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

interface CrisisEvent {
  id: string;
  user_id: string | null;
  message_content: string;
  severity: "low" | "medium" | "high" | "critical";
  resources_shown: string[];
  admin_reviewed: boolean;
  created_at: string;
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  low: { label: "Low", color: "green", icon: CheckCircle },
  medium: { label: "Medium", color: "amber", icon: AlertTriangle },
  high: { label: "High", color: "orange", icon: AlertTriangle },
  critical: { label: "Critical", color: "red", icon: XCircle },
};

export default function AdminCrisesPage() {
  const [crises, setCrises] = useState<CrisisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [reviewedFilter, setReviewedFilter] = useState<"all" | "reviewed" | "unreviewed">("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selectedCrisis, setSelectedCrisis] = useState<CrisisEvent | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchCrises = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (reviewedFilter !== "all") params.set("reviewed", reviewedFilter === "reviewed" ? "true" : "false");
      if (severityFilter !== "all") params.set("severity", severityFilter);

      const token = localStorage.getItem("saya_admin_token") || localStorage.getItem("saya_token");
      const res = await fetch(`${API_URL}/admin/crises?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch crises");
      const data = await res.json();
      setCrises(data.crises);
      setTotal(data.total);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrises();
  }, [page, pageSize, reviewedFilter, severityFilter]);

  const handleReview = async (crisisId: string) => {
    try {
      const token = localStorage.getItem("saya_admin_token") || localStorage.getItem("saya_token");
      const res = await fetch(`${API_URL}/admin/crises/${crisisId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reviewed: true }),
      });
      if (!res.ok) throw new Error("Failed to review crisis");
      
      setCrises(prev => prev.map(c => c.id === crisisId ? { ...c, admin_reviewed: true } : c));
      toast.success("Crisis marked as reviewed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString([], { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

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
          <Link href="/admin/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Activity className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link href="/admin/users" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Users className="w-5 h-5" />
            <span className="font-medium">Users</span>
          </Link>
          <Link href="/admin/analytics" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <LineChart className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </Link>
          <Link href="/admin/crises" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left bg-card text-text">
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
              <h1 className="text-2xl font-extrabold text-gradient-brand mb-1">Crisis Events</h1>
              <p className="text-dim">Monitor and review safety incidents</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchCrises} disabled={loading} className="btn-secondary">
                <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-4"
          >
            {[
              { label: "Total Events", value: total, icon: Shield, color: "purple" },
              { label: "Unreviewed", value: crises.filter(c => !c.admin_reviewed).length, icon: AlertTriangle, color: "red" },
              { label: "Critical", value: crises.filter(c => c.severity === "critical").length, icon: XCircle, color: "red" },
              { label: "This Week", value: crises.filter(c => new Date(c.created_at) > new Date(Date.now() - 7 * 86400000)).length, icon: Clock, color: "blue" },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="stat-num text-text">{stat.value}</p>
                  </div>
                  <div className={`grad-icon-sm`} style={{ background: `var(--${stat.color === "purple" ? "purple" : stat.color === "red" ? "red" : stat.color === "blue" ? "blue" : "green"})` }}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={reviewedFilter}
                onChange={(e) => { setReviewedFilter(e.target.value as any); setPage(1); }}
                className="input-field w-auto"
              >
                <option value="all">All Events</option>
                <option value="unreviewed">Unreviewed</option>
                <option value="reviewed">Reviewed</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
                className="input-field w-auto"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </motion.div>

          {/* Crises Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Severity</th>
                    <th>User</th>
                    <th>Message Preview</th>
                    <th>Resources</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crises.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-dim">
                        {loading ? <Loader2 className="w-8 h-8 mx-auto animate-spin" /> : "No crisis events found"}
                      </td>
                    </tr>
                  ) : (
                    crises.map((crisis) => {
                      const severityConfig = SEVERITY_CONFIG[crisis.severity];
                      return (
                        <tr key={crisis.id} className={`${crisis.id === selectedCrisis?.id ? "bg-[rgba(139,92,246,0.05)]" : ""} ${!crisis.admin_reviewed ? "border-l-4 border-red-500" : ""}`}>
                          <td className="text-sm text-dim">{formatDate(crisis.created_at)}</td>
                          <td>
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${severityConfig.color === "red" ? "bg-red-500/20 text-red-400" : severityConfig.color === "orange" ? "bg-orange-500/20 text-orange-400" : severityConfig.color === "amber" ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}`}>
                              <severityConfig.icon className="w-3 h-3" />
                              {severityConfig.label}
                            </span>
                          </td>
                          <td>
                            {crisis.user_id ? (
                              <span className="text-sm text-text font-mono text-xs">{crisis.user_id.slice(0, 8)}...</span>
                            ) : (
                              <span className="text-sm text-dim">Anonymous</span>
                            )}
                          </td>
                          <td className="max-w-xs">
                            <p className="text-sm text-text truncate">{crisis.message_content}</p>
                          </td>
                          <td className="text-sm text-dim">
                            {crisis.resources_shown.length} resource{crisis.resources_shown.length !== 1 ? "s" : ""}
                          </td>
                          <td>
                            <span className={`flex items-center gap-1 ${crisis.admin_reviewed ? "text-green-500" : "text-amber-500"}`}>
                              <span className={`w-2 h-2 rounded-full ${crisis.admin_reviewed ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                              {crisis.admin_reviewed ? "Reviewed" : "Pending"}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setSelectedCrisis(crisis); setShowDetail(true); }}
                                className="btn-ghost p-1.5"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {!crisis.admin_reviewed && (
                                <button
                                  onClick={() => handleReview(crisis.id)}
                                  className="btn-secondary p-1.5 text-xs"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Review
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-dim">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-ghost p-2 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * pageSize >= total}
                  className="btn-ghost p-2 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Crisis Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedCrisis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gradient-brand">Crisis Event Details</h3>
                <button onClick={() => setShowDetail(false)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">Event ID</p>
                    <p className="font-mono text-xs text-text break-all">{selectedCrisis.id}</p>
                  </div>
                  <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">Timestamp</p>
                    <p className="text-text">{formatDate(selectedCrisis.created_at)}</p>
                  </div>
                  <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">Severity</p>
                    {(() => { const sc = SEVERITY_CONFIG[selectedCrisis.severity]; const SeverityIcon = sc.icon; return (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sc.color === "red" ? "bg-red-500/20 text-red-400" : sc.color === "orange" ? "bg-orange-500/20 text-orange-400" : sc.color === "amber" ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}`}>
                      <SeverityIcon className="w-3 h-3" />
                      {sc.label}
                    </span>
                    ); })()}
                  </div>
                  <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 ${selectedCrisis.admin_reviewed ? "text-green-500" : "text-amber-500"}`}>
                      <span className={`w-2 h-2 rounded-full ${selectedCrisis.admin_reviewed ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                      {selectedCrisis.admin_reviewed ? "Reviewed" : "Pending Review"}
                    </span>
                  </div>
                </div>

                <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                  <p className="text-xs text-dim uppercase tracking-wider mb-2">Message Content</p>
                  <p className="text-text whitespace-pre-wrap bg-card p-4 rounded-xl">{selectedCrisis.message_content}</p>
                </div>

                <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                  <p className="text-xs text-dim uppercase tracking-wider mb-2">Resources Provided</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCrisis.resources_shown.length > 0 ? (
                      selectedCrisis.resources_shown.map((resource, idx) => (
                        <span key={idx} className="badge badge-teal">{resource}</span>
                      ))
                    ) : (
                      <span className="text-dim">No resources recorded</span>
                    )}
                  </div>
                </div>

                <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                  <p className="text-xs text-dim uppercase tracking-wider mb-2">User Info</p>
                  <p className="text-sm text-text">{selectedCrisis.user_id ? `User ID: ${selectedCrisis.user_id}` : "Anonymous user"}</p>
                </div>

                {!selectedCrisis.admin_reviewed && (
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <button onClick={() => setShowDetail(false)} className="btn-secondary flex-1">Close</button>
                    <button
                      onClick={() => handleReview(selectedCrisis.id)}
                      className="btn-primary flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Reviewed
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString([], { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}