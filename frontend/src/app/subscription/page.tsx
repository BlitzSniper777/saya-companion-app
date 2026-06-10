"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, CreditCard, Crown, Star, TrendingUp, Check, ChevronRight, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  price_lifetime: number | null;
  features: string[];
  message_limit: number;
  memory_days: number;
  modes: string[];
  voice_calls: boolean;
  adult_content: boolean;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("saya_token");
    if (!token) return;
    
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch(`${API_URL}/subscription/plans`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/subscription`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans);
      }
      if (subRes.ok) {
        const data = await subRes.json();
        setCurrentPlan(data.plan);
      }
    } catch (err) {
      console.error("Failed to fetch subscription data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string, interval: "month" | "year" | "lifetime" = "month") => {
    const token = localStorage.getItem("saya_token");
    if (!token) return;
    
    setUpgrading(planId);
    try {
      const res = await fetch(`${API_URL}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planId, interval }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      window.location.href = data.checkout_url;
    } catch (err: any) {
      toast.error(err.message);
      setUpgrading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const PLAN_ORDER = ["free", "companion", "gfbf", "adult"];
  const PLAN_LABELS: Record<string, string> = {
    free: "Free",
    companion: "Companion",
    gfbf: "GF/BF Companion",
    adult: "Adult Add-on",
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
      {/* Sidebar - simplified for settings pages */}
      <aside className="w-64 fixed left-0 top-0 h-screen z-30 flex flex-col" style={{background: '#06060f', borderRight: '1px solid rgba(139,92,246,0.18)'}}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
              style={{background: 'linear-gradient(135deg, #8b5cf6, #ec4899)'}}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="nav-brand text-lg">Saya</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[{id: "chat", label: "Chat", icon: Sparkles}, {id: "profile", label: "Profile", icon: CreditCard}].map((tab) => (
            <Link
              key={tab.id}
              href={`/${tab.id}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-dim hover:text-text hover:bg-card2`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="ml-64 flex-1 min-h-screen overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <h1 className="text-2xl font-extrabold text-gradient-brand mb-1">Subscription</h1>
            <p className="text-dim">Choose the plan that fits your journey with Saya</p>
          </motion.div>

          {/* Current Plan Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
            style={{background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)'}}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-dim uppercase tracking-wider mb-1">Current Plan</p>
                <p className="text-2xl font-extrabold text-gradient-brand capitalize">{PLAN_LABELS[currentPlan] || currentPlan}</p>
              </div>
              {currentPlan === "free" && (
                <Link href="#plans" className="btn-primary">
                  Upgrade Now
                </Link>
              )}
            </div>
          </motion.div>

          {/* Plans Grid */}
          <div id="plans" className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {PLAN_ORDER.map((planId) => {
              const plan = plans.find(p => p.id === planId);
              if (!plan) return null;
              
              const isCurrent = currentPlan === planId;
              const isHigherTier = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlan);
              const canUpgrade = isHigherTier || currentPlan === "free";
              
              return (
                <motion.div
                  key={planId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + PLAN_ORDER.indexOf(planId) * 0.1 }}
                  className={`glass-card flex flex-col ${isCurrent ? "border-purple-500/50" : ""}`}
                  style={{background: isCurrent ? 'rgba(139,92,246,0.05)' : 'transparent'}}
                >
                  {/* Plan Header */}
                  <div className="pb-4 border-b border-border mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-dim uppercase tracking-wider">{PLAN_LABELS[planId]}</span>
                      {isCurrent && <span className="badge badge-green text-xs">Current</span>}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gradient-brand">
                        {plan.price_monthly === 0 ? "$0" : formatPrice(plan.price_monthly)}
                      </span>
                      <span className="text-dim">/mo</span>
                    </div>
                    {plan.price_yearly && (
                      <p className="text-xs text-dim mt-1">
                        {formatPrice(plan.price_yearly)}/yr 
                        {plan.price_lifetime && `· ${formatPrice(plan.price_lifetime)} lifetime`}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-text">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="pt-4 border-t border-border">
                    {isCurrent ? (
                      <button className="btn-secondary w-full" disabled>
                        Current Plan
                      </button>
                    ) : canUpgrade ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleUpgrade(planId, "month")}
                          disabled={upgrading === planId}
                          className="btn-primary w-full"
                        >
                          {upgrading === planId ? <Loader2 className="w-4 h-4 animate-spin" /> : `Upgrade - ${formatPrice(plan.price_monthly)}/mo`}
                        </button>
                        {plan.price_yearly && (
                          <button
                            onClick={() => handleUpgrade(planId, "year")}
                            disabled={upgrading === planId}
                            className="btn-secondary w-full text-sm"
                          >
                            Yearly: {formatPrice(plan.price_yearly)}/yr (save {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                          </button>
                        )}
                        {plan.price_lifetime && (
                          <button
                            onClick={() => handleUpgrade(planId, "lifetime")}
                            disabled={upgrading === planId}
                            className="btn-secondary w-full text-sm"
                          >
                            Lifetime: {formatPrice(plan.price_lifetime)} (one-time)
                          </button>
                        )}
                      </div>
                    ) : (
                      <button className="btn-secondary w-full" disabled>
                        Downgrade not available
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card overflow-hidden"
          >
            <h3 className="font-bold text-lg p-6 mb-0">Feature Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4">Feature</th>
                    {PLAN_ORDER.map(planId => (
                      <th key={planId} className="text-center p-4 font-medium capitalize">{PLAN_LABELS[planId]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "messages", label: "Daily Messages", free: "15", companion: "Unlimited", gfbf: "Unlimited", adult: "Unlimited" },
                    { key: "memory", label: "Memory Window", free: "7 days", companion: "Permanent", gfbf: "Permanent", adult: "Permanent" },
                    { key: "friend", label: "Friend Mode", free: "✓", companion: "✓", gfbf: "✓", adult: "✓" },
                    { key: "therapist", label: "Therapist Mode", free: "✗", companion: "✓", gfbf: "✓", adult: "✓" },
                    { key: "life_coach", label: "Life Coach Mode", free: "✗", companion: "✓", gfbf: "✓", adult: "✓" },
                    { key: "romantic", label: "Romantic Mode", free: "✗", companion: "✗", gfbf: "✓", adult: "✓" },
                    { key: "adult", label: "Adult Content", free: "✗", companion: "✗", gfbf: "✗", adult: "✓" },
                    { key: "voice", label: "Voice Calls", free: "✗", companion: "✗", gfbf: "Credits", adult: "Credits" },
                    { key: "outreach", label: "Daily Outreach", free: "✗", companion: "✓", gfbf: "✓", adult: "✓" },
                    { key: "stories", label: "Co-written Stories", free: "✗", companion: "✓", gfbf: "✓", adult: "✓" },
                    { key: "wisdom", label: "Wisdom Storytelling", free: "✗", companion: "✓", gfbf: "✓", adult: "✓" },
                    { key: "mood", label: "Mood Timeline", free: "✗", companion: "✓", gfbf: "✓", adult: "✓" },
                    { key: "goals", label: "Life Goals Tracker", free: "✗", companion: "✓", gfbf: "✓", adult: "✓" },
                    { key: "gifts", label: "Gift Store", free: "View only", companion: "✓", gfbf: "✓ + Romantic", adult: "✓ + Spicy" },
                    { key: "crisis", label: "Crisis Support", free: "✓", companion: "✓", gfbf: "✓", adult: "✓" },
                  ].map((row, idx) => (
                    <tr key={row.key} className={`${idx % 2 === 0 ? "bg-card/50" : ""} border-b border-border/50`}>
                      <td className="p-4 font-medium text-text">{row.label}</td>
                      {PLAN_ORDER.map(planId => (
                        <td key={planId} className="text-center p-4 text-dim">
                          {(row as any)[planId]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Billing Portal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-lg mb-4">Manage Billing</h3>
            <p className="text-dim mb-4">Update payment method, view invoices, or cancel subscription</p>
            <button
              onClick={async () => {
                const token = localStorage.getItem("saya_token");
                if (!token) return;
                try {
                  const res = await fetch(`${API_URL}/billing/portal`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ return_url: `${window.location.origin}/subscription` }),
                  });
                  const data = await res.json();
                  if (res.ok) window.location.href = data.portal_url;
                } catch (err) {
                  toast.error("Failed to open billing portal");
                }
              }}
              className="btn-secondary"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Open Billing Portal
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}