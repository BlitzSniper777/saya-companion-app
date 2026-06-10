"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, MessageSquare, Search, Filter, MoreHorizontal, User, Mail, Clock, ChevronLeft, ChevronRight, Eye, Flag, Shield, Download, Zap, Activity, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

interface AdminMessage {
  id: string;
  conversation_id: string;
  user_email: string;
  role: "user" | "assistant";
  content: string;
  emotion_tags: string[];
  created_at: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [userFilter, setUserFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "assistant">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (userFilter) params.set("user_id", userFilter);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const token = localStorage.getItem("saya_admin_token") || localStorage.getItem("saya_token");
      const res = await fetch(`${API_URL}/admin/messages?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data.messages);
      setTotal(data.total);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, pageSize, userFilter, roleFilter, dateFrom, dateTo]);

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
              <MessageSquare className="w-5 h-5 text-white" />
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
            <User className="w-5 h-5" />
            <span className="font-medium">Users</span>
          </Link>
          <Link href="/admin/analytics" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Activity className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </Link>
          <Link href="/admin/crises" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Crisis Events</span>
          </Link>
          <Link href="/admin/messages" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left bg-card text-text">
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
              <h1 className="text-2xl font-extrabold text-gradient-brand mb-1">Message Logs</h1>
              <p className="text-dim">Platform-wide message monitoring</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchMessages} disabled={loading} className="btn-secondary">
                <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="text"
                  value={userFilter}
                  onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                  placeholder="Filter by user email..."
                  className="input-field pl-12"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value as any); setPage(1); }}
                className="input-field w-auto"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="assistant">Saya</option>
              </select>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="input-field w-auto"
                placeholder="From"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="input-field w-auto"
                placeholder="To"
              />
            </div>
          </motion.div>

          {/* Messages Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Role</th>
                    <th>User</th>
                    <th>Conversation</th>
                    <th>Content</th>
                    <th>Emotions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-dim">
                        {loading ? <Loader2 className="w-8 h-8 mx-auto animate-spin" /> : "No messages found"}
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg) => (
                      <tr key={msg.id} className={`${msg.id === selectedMessage?.id ? "bg-[rgba(139,92,246,0.05)]" : ""}`}>
                        <td className="text-xs text-dim">{formatDate(msg.created_at)}</td>
                        <td>
                          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${msg.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                            {msg.role === "user" ? <Mail className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                            {msg.role}
                          </span>
                        </td>
                        <td className="text-sm text-text font-mono text-xs">{msg.user_email}</td>
                        <td className="font-mono text-xs text-dim">{msg.conversation_id.slice(0, 8)}...</td>
                        <td className="max-w-xs">
                          <p className="text-sm text-text truncate">{msg.content}</p>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {msg.emotion_tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="badge badge-purple text-xs">{tag}</span>
                            ))}
                            {msg.emotion_tags.length > 3 && (
                              <span className="badge badge-dim text-xs">+{msg.emotion_tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => { setSelectedMessage(msg); setShowDetail(true); }}
                            className="btn-ghost p-1.5"
                            title="View Full"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
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

      {/* Message Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedMessage && (
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
              className="glass-card w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gradient-brand">Message Details</h3>
                <button onClick={() => setShowDetail(false)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">Message ID</p>
                    <p className="font-mono text-xs text-text break-all">{selectedMessage.id}</p>
                  </div>
                  <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">Timestamp</p>
                    <p className="text-text">{formatDate(selectedMessage.created_at)}</p>
                  </div>
                  <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">Role</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${selectedMessage.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                      <Mail className="w-3 h-3" />
                      {selectedMessage.role}
                    </span>
                  </div>
                  <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-xs text-dim uppercase tracking-wider mb-1">Conversation</p>
                    <p className="font-mono text-xs text-text">{selectedMessage.conversation_id}</p>
                  </div>
                </div>

                <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                  <p className="text-xs text-dim uppercase tracking-wider mb-2">User</p>
                  <p className="text-sm text-text">{selectedMessage.user_email}</p>
                </div>

                <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                  <p className="text-xs text-dim uppercase tracking-wider mb-2">Content</p>
                  <p className="text-text whitespace-pre-wrap bg-card p-4 rounded-xl">{selectedMessage.content}</p>
                </div>

                <div className="glass-card p-4" style={{background: 'rgba(17,17,24,0.8)'}}>
                  <p className="text-xs text-dim uppercase tracking-wider mb-2">Emotion Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMessage.emotion_tags.length > 0 ? (
                      selectedMessage.emotion_tags.map((tag, idx) => (
                        <span key={idx} className="badge badge-purple">{tag}</span>
                      ))
                    ) : (
                      <span className="text-dim">No emotion tags</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowDetail(false)}
                  className="btn-secondary w-full"
                >
                  Close
                </button>
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