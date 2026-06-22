"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Loader2, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, XCircle, CheckCircle, Eye, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  adminGetUsers,
  adminSetUserPlan,
  adminManageCoins,
  adminGetUserBehavior,
  adminSetUserStatus,
} from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

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

interface BehaviorData {
  messages_per_day: { date: string; count: number }[];
  emotion_distribution: { tag: string; count: number }[];
  mode_distribution: { mode: string; count: number }[];
  total_messages: number;
  days_active: number;
  coins_balance: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  companion: "Companion ($9.99/mo)",
  gfbf: "Romantic ($12.99/mo)",
  adult: "Adult ($14.99/mo)",
  vip: "VIP ($29.99/mo)",
};

const PLAN_BADGE_CLASSES: Record<string, string> = {
  free: "badge-dim",
  companion: "badge-purple",
  gfbf: "badge-pink",
  adult: "badge-red",
  vip: "badge-gold",
};

const PLAN_SHORT: Record<string, string> = {
  free: "Free",
  companion: "Companion",
  gfbf: "Romantic",
  adult: "Adult",
  vip: "VIP",
};

const MODE_COLORS: Record<string, string> = {
  friend: "bg-blue-500",
  romantic: "bg-pink-500",
  adult: "bg-red-500",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
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
}

function userInitial(user: AdminUser) {
  return (user.full_name?.charAt(0) || user.email.charAt(0)).toUpperCase();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SubscriptionTab({ user, onUserUpdate }: { user: AdminUser; onUserUpdate: (updated: Partial<AdminUser>) => void }) {
  const [plan, setPlan] = useState(user.plan);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [addDays, setAddDays] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleSavePlan = async () => {
    setSaving(true);
    try {
      await adminSetUserPlan(user.id, plan, billingCycle, addDays > 0 ? addDays : undefined);
      toast.success("Plan updated!");
      onUserUpdate({ plan });
    } catch (err: any) {
      toast.error(err.message || "Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setToggling(true);
    try {
      await adminSetUserStatus(user.id, !user.is_active);
      toast.success(`Account ${!user.is_active ? "activated" : "deactivated"}`);
      onUserUpdate({ is_active: !user.is_active });
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card2">
        <span className="text-dim text-sm">Current plan:</span>
        <span className={`pill ${PLAN_BADGE_CLASSES[user.plan] || "badge-dim"}`}>
          {PLAN_SHORT[user.plan] || user.plan}
        </span>
      </div>

      {/* Plan selector */}
      <div>
        <label className="block text-sm font-medium text-dim mb-2">Change Plan</label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="input-field"
        >
          <option value="free">Free</option>
          <option value="companion">Companion ($9.99/mo)</option>
          <option value="gfbf">Romantic ($12.99/mo)</option>
          <option value="adult">Adult ($14.99/mo)</option>
          <option value="vip">VIP ($29.99/mo)</option>
        </select>
      </div>

      {/* Billing cycle */}
      {plan !== "free" && (
        <div>
          <label className="block text-sm font-medium text-dim mb-2">Billing Cycle</label>
          <div className="flex gap-2">
            {(["monthly", "yearly", "lifetime"] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                  billingCycle === cycle
                    ? "border-purple-500 bg-purple-500/20 text-purple-300"
                    : "border-border text-dim hover:border-purple-500/50"
                }`}
              >
                {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add extra days */}
      {plan !== "free" && billingCycle !== "lifetime" && (
        <div>
          <label className="block text-sm font-medium text-dim mb-2">Add Extra Days</label>
          <input
            type="number"
            min={0}
            max={365}
            value={addDays}
            onChange={(e) => setAddDays(Math.max(0, Math.min(365, Number(e.target.value))))}
            className="input-field"
            placeholder="0"
          />
        </div>
      )}

      <button
        onClick={handleSavePlan}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Plan"}
      </button>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Activate / Deactivate */}
      <button
        onClick={handleToggleStatus}
        disabled={toggling}
        className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all border ${
          user.is_active
            ? "border-red-500/50 text-red-400 hover:bg-red-500/10"
            : "border-green-500/50 text-green-400 hover:bg-green-500/10"
        }`}
      >
        {toggling ? (
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        ) : user.is_active ? (
          "Deactivate Account"
        ) : (
          "Activate Account"
        )}
      </button>
    </div>
  );
}

function CoinsTab({ user }: { user: AdminUser }) {
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  useEffect(() => {
    // fetch current balance from behavior endpoint lazily
    setCurrentBalance(null);
  }, [user.id]);

  const handleCoins = async (operation: "add" | "set", rawAmount?: number) => {
    const finalAmount = rawAmount !== undefined ? rawAmount : amount;
    if (finalAmount === 0 && operation !== "set") return;
    setSaving(true);
    try {
      const result = await adminManageCoins(user.id, finalAmount, operation);
      toast.success(`Coins updated! New balance: ${result.new_balance?.toLocaleString()}`);
      setCurrentBalance(result.new_balance);
      setAmount(0);
    } catch (err: any) {
      toast.error(err.message || "Failed to update coins");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Balance display */}
      <div className="text-center py-6">
        <div className="text-5xl mb-2">🪙</div>
        {currentBalance !== null ? (
          <p className="text-3xl font-extrabold text-gradient-brand">{currentBalance.toLocaleString()}</p>
        ) : (
          <p className="text-dim text-sm">Balance shown after first action</p>
        )}
        <p className="text-dim text-xs mt-1">Coin balance</p>
      </div>

      {/* Amount input */}
      <div>
        <label className="block text-sm font-medium text-dim mb-2">Amount</label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          className="input-field"
          placeholder="Enter amount..."
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleCoins("add", amount)}
          disabled={saving || amount === 0}
          className="btn-primary py-2 text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "+ Add"}
        </button>
        <button
          onClick={() => handleCoins("add", -amount)}
          disabled={saving || amount === 0}
          className="btn-secondary py-2 text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "− Subtract"}
        </button>
        <button
          onClick={() => handleCoins("set", amount)}
          disabled={saving}
          className="btn-secondary py-2 text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "= Set to"}
        </button>
      </div>
    </div>
  );
}

function BehaviorTab({ user }: { user: AdminUser }) {
  const [data, setData] = useState<BehaviorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    setLoading(true);
    adminGetUserBehavior(user.id, 30)
      .then((d: BehaviorData) => {
        setData(d);
        setLoaded(true);
      })
      .catch((err: any) => toast.error(err.message || "Failed to load behavior"))
      .finally(() => setLoading(false));
  }, [user.id, loaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-dim text-center py-8">No behavior data available.</p>;
  }

  const maxCount = Math.max(...data.messages_per_day.map((d) => d.count), 1);
  const totalModeMessages = data.mode_distribution.reduce((s, m) => s + m.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-extrabold text-gradient-brand">{data.total_messages}</p>
          <p className="text-xs text-dim mt-1">Messages</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-extrabold text-gradient-brand">{data.days_active}</p>
          <p className="text-xs text-dim mt-1">Days Active</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-extrabold text-gradient-brand">{data.coins_balance?.toLocaleString() ?? "—"}</p>
          <p className="text-xs text-dim mt-1">Coins 🪙</p>
        </div>
      </div>

      {/* Bar chart: messages per day */}
      {data.messages_per_day.length > 0 && (
        <div>
          <p className="text-sm font-medium text-dim mb-3">Messages / Day (last 30 days)</p>
          <div className="flex items-end gap-0.5 h-[120px] overflow-x-auto">
            {data.messages_per_day.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count}`}
                className="flex-1 min-w-[4px] rounded-t-sm bg-purple-500 opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${Math.round((d.count / maxCount) * 100)}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Emotion distribution */}
      {data.emotion_distribution.length > 0 && (
        <div>
          <p className="text-sm font-medium text-dim mb-3">Top Emotions</p>
          <div className="space-y-2">
            {data.emotion_distribution.map((e) => (
              <div key={e.tag} className="flex items-center gap-2">
                <span className="text-xs text-dim w-20 truncate">{e.tag}</span>
                <div className="flex-1 bg-card2 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-pink-500"
                    style={{ width: `${Math.round((e.count / data.emotion_distribution[0].count) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-dim w-6 text-right">{e.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode distribution */}
      {data.mode_distribution.some((m) => m.count > 0) && (
        <div>
          <p className="text-sm font-medium text-dim mb-3">Companion Mode Distribution</p>
          <div className="flex gap-2 flex-wrap">
            {data.mode_distribution.map((m) => (
              <div key={m.mode} className={`pill flex items-center gap-1.5 ${MODE_COLORS[m.mode] || "bg-gray-500"} bg-opacity-20`}>
                <span className={`w-2 h-2 rounded-full ${MODE_COLORS[m.mode] || "bg-gray-500"}`} />
                <span className="capitalize">{m.mode}</span>
                <span className="font-bold">{Math.round((m.count / totalModeMessages) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Slide-out Panel ────────────────────────────────────────────────────────────

function UserPanel({
  user,
  onClose,
  onUserUpdate,
}: {
  user: AdminUser;
  onClose: () => void;
  onUserUpdate: (userId: string, updated: Partial<AdminUser>) => void;
}) {
  const [activeTab, setActiveTab] = useState<"subscription" | "coins" | "behavior">("subscription");

  const handleUserUpdate = useCallback(
    (updated: Partial<AdminUser>) => onUserUpdate(user.id, updated),
    [user.id, onUserUpdate]
  );

  return (
    <>
      {/* Mobile backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="fixed top-0 right-0 h-full w-full lg:w-[420px] bg-bg border-l border-border z-50 flex flex-col shadow-2xl overflow-hidden"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
          >
            <span className="text-base font-bold text-white">{userInitial(user)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text truncate">{user.full_name || "Unnamed"}</p>
            <p className="text-xs text-dim truncate">{user.email}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0">
          <span className={`pill ${PLAN_BADGE_CLASSES[user.plan] || "badge-dim"}`}>
            {PLAN_SHORT[user.plan] || user.plan}
          </span>
          <span className={`flex items-center gap-1 text-xs ${user.is_active ? "text-green-400" : "text-red-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-green-400" : "bg-red-400"}`} />
            {user.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {(["subscription", "coins", "behavior"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-all capitalize border-b-2 ${
                activeTab === tab
                  ? "border-purple-500 text-purple-300"
                  : "border-transparent text-dim hover:text-text"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "subscription" && (
                <SubscriptionTab user={user} onUserUpdate={handleUserUpdate} />
              )}
              {activeTab === "coins" && <CoinsTab user={user} />}
              {activeTab === "behavior" && <BehaviorTab user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortField, setSortField] = useState<"created_at" | "last_active" | "messages_today">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const isActive = statusFilter === "all" ? undefined : statusFilter === "active";
      const data = await adminGetUsers(page, pageSize, search, planFilter, isActive);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, planFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleUserUpdate = useCallback((userId: string, updated: Partial<AdminUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updated } : u))
    );
    setSelectedUser((prev) => (prev?.id === userId ? { ...prev, ...updated } : prev));
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AdminLayout>
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
              <option value="gfbf">Romantic</option>
              <option value="adult">Adult</option>
              <option value="vip">VIP</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as "all" | "active" | "inactive"); setPage(1); }}
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
                  <th
                    onClick={() => handleSort("created_at")}
                    className="cursor-pointer select-none"
                  >
                    User
                    {sortField === "created_at" && (
                      sortDir === "asc"
                        ? <ChevronUp className="w-4 h-4 inline ml-1" />
                        : <ChevronDown className="w-4 h-4 inline ml-1" />
                    )}
                  </th>
                  <th>Plan</th>
                  <th
                    onClick={() => handleSort("last_active")}
                    className="cursor-pointer select-none"
                  >
                    Last Active
                    {sortField === "last_active" && (
                      sortDir === "asc"
                        ? <ChevronUp className="w-4 h-4 inline ml-1" />
                        : <ChevronDown className="w-4 h-4 inline ml-1" />
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("messages_today")}
                    className="cursor-pointer select-none"
                  >
                    Msgs Today
                    {sortField === "messages_today" && (
                      sortDir === "asc"
                        ? <ChevronUp className="w-4 h-4 inline ml-1" />
                        : <ChevronDown className="w-4 h-4 inline ml-1" />
                    )}
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-dim">
                      {loading
                        ? <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                        : "No users found"}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`cursor-pointer transition-colors hover:bg-card2 ${
                        user.id === selectedUser?.id ? "bg-purple-500/5" : ""
                      }`}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                          >
                            <span className="text-sm font-bold text-white">{userInitial(user)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-text truncate max-w-[160px]">
                              {user.full_name || "Unnamed"}
                            </p>
                            <p className="text-xs text-dim truncate max-w-[160px]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${PLAN_BADGE_CLASSES[user.plan] || "badge-dim"}`}>
                          {PLAN_SHORT[user.plan] || user.plan}
                        </span>
                      </td>
                      <td className="text-sm text-dim">{formatDate(user.last_active)}</td>
                      <td className="text-sm font-medium text-text">{user.messages_today}</td>
                      <td>
                        <span
                          className={`flex items-center gap-1 text-sm ${
                            user.is_active ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              user.is_active ? "bg-green-400" : "bg-red-400"
                            }`}
                          />
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn-ghost p-1.5"
                            title="View Details"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="btn-ghost p-1.5"
                            title="Toggle Status"
                            onClick={async () => {
                              try {
                                await adminSetUserStatus(user.id, !user.is_active);
                                handleUserUpdate(user.id, { is_active: !user.is_active });
                                toast.success(
                                  `${user.is_active ? "Deactivated" : "Activated"} ${user.email}`
                                );
                              } catch (err: any) {
                                toast.error(err.message);
                              }
                            }}
                          >
                            {user.is_active
                              ? <XCircle className="w-4 h-4 text-red-400" />
                              : <CheckCircle className="w-4 h-4 text-green-400" />}
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
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{" "}
                {total.toLocaleString()}
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
                      className={`w-8 h-8 rounded-xl font-medium transition-all ${
                        page === pageNum
                          ? "bg-purple-500 text-white"
                          : "text-dim hover:text-text hover:bg-card2"
                      }`}
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

      {/* Slide-out panel */}
      <AnimatePresence>
        {selectedUser && (
          <UserPanel
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
