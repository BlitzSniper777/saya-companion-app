"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Users, Search, Filter, MoreHorizontal, Shield, Mail, CreditCard, Crown, Heart, TrendingUp, Flame, Activity, ChevronLeft, ChevronRight, Check, X, Edit, Trash2, Eye, Bell, Zap, ChevronUp, ChevronDown, XCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  messages_today: number;
  last_active: string | null;
  is_active: boolean;
  created_at: string;
}

interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  companion: "Companion",
  gfbf: "GF/BF",
  adult: "Adult",
};

const PLAN_BADGES: Record<string, string> = {
  free: "badge-dim",
  companion: "badge-purple",
  gfbf: "badge-pink",
  adult: "badge-red",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortField, setSortField] = useState<"created_at" | "last_active" | "messages_today">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });
      if (search) params.set("search", search);
      if (planFilter) params.set("plan", planFilter);
      if (statusFilter !== "all") params.set("is_active", statusFilter === "active" ? "true" : "false");
      params.set("sort", sortField);
      params.set("order", sortDir);

      const token = localStorage.getItem("saya_admin_token") || localStorage.getItem("saya_token");
      const res = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, search, planFilter, statusFilter, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never";
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const totalPages = Math.ceil(total / pageSize);

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
          <Link href="/admin/dashboard" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Activity className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link href="/admin/users" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left bg-card text-text">
            <Users className="w-5 h-5" />
            <span className="font-medium">Users</span>
          </Link>
          <Link href="/admin/analytics" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </Link>
          <Link href="/admin/crises" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Crisis Events</span>
          </Link>
          <Link href="/admin/messages" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
            <Mail className="w-5 h-5" />
            <span className="font-medium">Messages</span>
          </Link>
          <div className="pt-4 mt-4 border-t border-border">
            <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2">
              <Sparkles className="w-5 h-5" />
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
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
          >
            <div>
              <h1 className="text-2xl font-extrabold text-gradient-brand mb-1">User Management</h1>
              <p className="text-dim">{total.toLocaleString()} total users</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={fetchUsers} disabled={loading} className="btn-secondary">
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
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search email or name..."
                  className="input-field pl-12"
                />
              </div>
              <select
                value={planFilter}
                onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                className="input-field w-auto"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="companion">Companion</option>
                <option value="gfbf">GF/BF</option>
                <option value="adult">Adult</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
                className="input-field w-auto"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={`${sortField}:${sortDir}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split(":");
                  setSortField(field as typeof sortField);
                  setSortDir(dir as typeof sortDir);
                  setPage(1);
                }}
                className="input-field w-auto"
              >
                <option value="created_at:desc">Newest First</option>
                <option value="created_at:asc">Oldest First</option>
                <option value="last_active:desc">Recently Active</option>
                <option value="messages_today:desc">Most Messages</option>
              </select>
            </div>
          </motion.div>

          {/* Users Table */}
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
                    <th onClick={() => handleSort("created_at")} className="cursor-pointer">
                      User
                      {sortField === "created_at" && (sortDir === "asc" ? <ChevronUp className="w-4 h-4 inline ml-1" /> : <ChevronDown className="w-4 h-4 inline ml-1" />)}
                    </th>
                    <th onClick={() => handleSort("last_active")} className="cursor-pointer">
                      Last Active
                      {sortField === "last_active" && (sortDir === "asc" ? <ChevronUp className="w-4 h-4 inline ml-1" /> : <ChevronDown className="w-4 h-4 inline ml-1" />)}
                    </th>
                    <th onClick={() => handleSort("messages_today")} className="cursor-pointer">
                      Messages Today
                      {sortField === "messages_today" && (sortDir === "asc" ? <ChevronUp className="w-4 h-4 inline ml-1" /> : <ChevronDown className="w-4 h-4 inline ml-1" />)}
                    </th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-dim">
                        {loading ? <Loader2 className="w-8 h-8 mx-auto animate-spin" /> : "No users found"}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className={`${user.id === selectedUser?.id ? "bg-[rgba(139,92,246,0.05)]" : ""}`}>
                        <td className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                            <span className="text-sm font-bold text-white">
                              {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-text truncate max-w-xs">{user.full_name || "Unnamed"}</p>
                            <p className="text-xs text-dim truncate max-w-xs">{user.email}</p>
                          </div>
                        </td>
                        <td className="text-sm text-dim">{formatDate(user.last_active)}</td>
                        <td className="text-sm font-medium text-text">{user.messages_today}</td>
                        <td>
                          <span className={`pill ${PLAN_BADGES[user.plan] || "badge-dim"}`}>
                            {PLAN_LABELS[user.plan] || user.plan}
                          </span>
                        </td>
                        <td>
                          <span className={`flex items-center gap-1 ${user.is_active ? "text-green-500" : "text-red-500"}`}>
                            <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-green-500" : "bg-red-500"}`} />
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="text-sm text-dim">{formatDate(user.created_at)}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button className="btn-ghost p-1.5" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="btn-ghost p-1.5" title="Toggle Status">
                              {user.is_active ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                            </button>
                            <button className="btn-ghost p-1.5" title="Delete">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-xl font-medium transition-all ${page === pageNum ? "bg-purple-500 text-white" : "text-dim hover:text-text hover:bg-card2"}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="btn-ghost p-2 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}