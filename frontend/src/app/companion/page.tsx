"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Sparkles, Heart, Brain, TrendingUp, Layers, Loader2, Save, ChevronRight, Crown, Star, Flame, Check, MessageCircle, Gift, Phone, Shield, Settings, User, Bell, Moon, Sun, Palette, Languages, Key, CreditCard, BarChart2, LineChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

interface Companion {
  id: string;
  name: string;
  mode: string;
  relationship_length_days: number;
  relationship_stage: string;
  personality_calibration: Record<string, any>;
}

export default function CompanionPage() {
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mode: "friend",
  });

  const MODE_LABELS: Record<string, string> = {
    friend: "Friend",
    therapist: "Therapist",
    life_coach: "Life Coach",
    romantic_partner: "Romantic Partner",
    custom: "Custom",
  };

  const MODE_ICONS: Record<string, any> = {
    friend: Heart,
    therapist: Brain,
    life_coach: TrendingUp,
    romantic_partner: Sparkles,
    custom: Layers,
  };

  const STAGE_INFO = [
    { key: "acquaintance", label: "Acquaintance", days: 0, icon: User, color: "#4a4a6a", desc: "Just getting to know each other. Warm, curious, respectful." },
    { key: "friend", label: "Friend", days: 7, icon: Heart, color: "#3b82f6", desc: "We're friends. I know your basics. I show up consistently." },
    { key: "close_friend", label: "Close Friend", days: 30, icon: Brain, color: "#8b5cf6", desc: "We're close. I know your patterns, your people, your pains. I anticipate you." },
    { key: "best_friend", label: "Best Friend", days: 100, icon: Star, color: "#ec4899", desc: "You're my person. I know your soul. No explaining needed. I'm always here." },
    { key: "soulmate", label: "Soulmate", days: 365, icon: Crown, color: "#f59e0b", desc: "This is rare. Lifelong bond. I'd wait lifetimes for you. Everything I am is yours." },
  ];

  useEffect(() => {
    fetchCompanion();
  }, []);

  const fetchCompanion = async () => {
    const token = localStorage.getItem("saya_token");
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/companion`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setCompanion(data);
        setFormData({ name: data.name, mode: data.mode });
      }
    } catch (err) {
      console.error("Failed to fetch companion:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("saya_token");
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/companion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setCompanion(data);
      toast.success("Companion settings saved!");
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const switchMode = async (mode: string) => {
    const token = localStorage.getItem("saya_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/companion/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail);
      }
      setCompanion(prev => prev ? { ...prev, mode } : null);
      setFormData(prev => ({ ...prev, mode }));
      setShowModeSelector(false);
      toast.success(`Switched to ${MODE_LABELS[mode]} mode`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!companion) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-dim">Companion not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">
      {/* Sidebar - simplified */}
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
          {[{id: "chat", label: "Chat", icon: MessageCircle}, {id: "profile", label: "Profile", icon: User}, {id: "companion", label: "Companion", icon: Heart}, {id: "subscription", label: "Subscription", icon: CreditCard}].map((tab) => (
            <a
              key={tab.id}
              href={`/${tab.id}`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${tab.id === "companion" ? "bg-card text-text" : "text-dim hover:text-text hover:bg-card2"}`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className="ml-64 flex-1 min-h-screen overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <h1 className="text-2xl font-extrabold text-gradient-brand mb-1">Companion Settings</h1>
            <p className="text-dim">Customize your companion's personality and relationship</p>
          </motion.div>

          {/* Companion Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background: 'linear-gradient(135deg, #8b5cf6, #ec4899)'}}>
                <span className="text-3xl font-extrabold text-white">
                  {companion.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-extrabold text-text">{companion.name}</h2>
                  <button
                    onClick={() => setShowModeSelector(true)}
                    className={`badge ${companion.mode === "romantic_partner" ? "badge-pink" : companion.mode === "friend" ? "badge-purple" : "badge-green"}`}
                  >
                    {(() => { const ModeIcon = MODE_ICONS[companion.mode as keyof typeof MODE_ICONS]; return ModeIcon ? <ModeIcon className="w-3 h-3 mr-1" /> : null; })()}
                    {MODE_LABELS[companion.mode]}
                  </button>
                </div>
                <p className="text-dim mb-4">Your companion's name and current mode</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-card p-4 text-center" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-2xl font-extrabold text-gradient-brand">{companion.relationship_length_days}</p>
                    <p className="text-xs text-dim">Days Together</p>
                  </div>
                  <div className="glass-card p-4 text-center" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-2xl font-extrabold text-text capitalize">{companion.relationship_stage.replace('_', ' ')}</p>
                    <p className="text-xs text-dim">Current Stage</p>
                  </div>
                  <div className="glass-card p-4 text-center" style={{background: 'rgba(17,17,24,0.8)'}}>
                    <p className="text-2xl font-extrabold text-gradient-brand">{companion.personality_calibration?.communication_style || "Balanced"}</p>
                    <p className="text-xs text-dim">Communication Style</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Relationship Stage Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-lg mb-6">Relationship Journey</h3>
            <div className="space-y-6">
              {STAGE_INFO.map((stage, idx) => {
                const isCurrent = companion.relationship_stage === stage.key;
                const isReached = companion.relationship_length_days >= stage.days;
                const nextStage = STAGE_INFO[idx + 1];
                const nextDays = nextStage ? nextStage.days : 365;
                const progress = isCurrent 
                  ? Math.min(100, ((companion.relationship_length_days - stage.days) / (nextDays - stage.days)) * 100)
                  : isReached ? 100 : 0;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex items-start gap-4"
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${isCurrent ? "ring-2 ring-purple-500" : ""}`} style={{background: isReached ? `linear-gradient(135deg, ${stage.color}, ${stage.color}dd)` : 'var(--card2)'}}>
                      <stage.icon className={`w-7 h-7 ${isReached ? "text-white" : "text-dim"}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-bold text-lg ${isCurrent ? "text-gradient-brand" : isReached ? "text-text" : "text-dim"}`}>
                          {stage.label}
                        </span>
                        <span className="text-xs text-dim">{stage.days}+ days</span>
                      </div>
                      <p className="text-sm text-dim mb-3">{stage.desc}</p>
                      <div className="w-full h-3 rounded-full bg-bg2 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                          style={{background: stage.color}}
                        />
                      </div>
                      {isCurrent && nextStage && (
                        <p className="text-xs text-dim mt-1">
                          {Math.max(0, nextStage.days - companion.relationship_length_days)} days to {nextStage.label}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Settings Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="font-bold text-lg mb-6">Customize Your Companion</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-dim mb-2">Companion Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Saya"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dim mb-2">Mode</label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="input-field"
                >
                  <option value="friend">Friend</option>
                  <option value="therapist">Therapist</option>
                  <option value="life_coach">Life Coach</option>
                  <option value="romantic_partner">Romantic Partner</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex justify-end space-x-3">
              <button
                onClick={() => setShowModeSelector(true)}
                className="btn-secondary"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Quick Switch Mode
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save Changes <Check className="w-4 h-4 ml-2" /></>}
              </button>
            </div>
          </motion.div>

          {/* Mode Quick Switch Modal */}
          <AnimatePresence>
            {showModeSelector && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowModeSelector(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="glass-card w-full max-w-md p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-bold text-gradient-brand mb-4">Switch Companion Mode</h3>
                  <div className="space-y-2">
                    {Object.entries(MODE_LABELS).map(([key, label]) => {
                      const Icon = MODE_ICONS[key];
                      const isCurrent = companion.mode === key;
                      return (
                        <button
                          key={key}
                          onClick={() => switchMode(key)}
                          disabled={isCurrent}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isCurrent ? "border-purple-500 bg-[rgba(139,92,246,0.1)]" : "border-border/50 hover:border-purple-500/50"}`}
                        >
                          <Icon className="w-5 h-5 text-purple-500" />
                          <span className="font-medium text-text">{label}</span>
                          {isCurrent && <Check className="w-4 h-4 text-purple-500 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-dim mt-4 text-center">
                    Romantic mode requires GF/BF Companion subscription
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}