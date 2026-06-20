"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { updateProfile, deleteAccount, getAllMessages, changeCompanion, getCompanionCatalog, uploadAvatar, getCompanionHistory, restoreCompanion } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Pill } from "@/components/ui/Pill";
import { Textarea } from "@/components/ui/Textarea";
import {
  User, Mail, Lock, Shield, Bell, Palette, Heart, CreditCard, Settings, Trash2, LogOut, Eye, EyeOff, Save, Loader2, X, Check, Star, Sparkles, BarChart3, Activity, TrendingUp, Heart as HeartIcon, Brain, Flame, Calendar, Zap, RefreshCw, Camera
} from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

export default function ProfilePage() {
  const router = useRouter();
  const { user, companion, subscription, token, logout, refreshUser, setCompanion, setSubscription } = useAuth();
  const { toast } = useToast();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Tabs - updated to 4 tabs as per requirements
  const [activeTab, setActiveTab] = useState<"profile" | "companion" | "security" | "mood">("profile");
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    language: user?.language || "en",
    timezone: user?.timezone || "UTC",
  });
  
  // Security form
  const [securityForm, setSecurityForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Change / restore companion
  const [changingCompanion, setChangingCompanion] = useState(false);
  const [companionHistory, setCompanionHistory] = useState<Array<{
    history_id: string; companion_id: string; name: string; gender: string;
    personality_type: string; bio: string; conversation_id: string | null; changed_at: string;
  }>>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [restoringCompanion, setRestoringCompanion] = useState(false);

  // Companion picker
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [companionCatalog, setCompanionCatalog] = useState<Array<{
    id: string; name: string; gender: string; personality_type: string; bio: string; pronoun: string;
    available: boolean; locked_reason: string | null;
  }>>([]);
  const [pickerSelectedId, setPickerSelectedId] = useState("");
  const [pickerGenderFilter, setPickerGenderFilter] = useState<"all" | "female" | "male">("all");
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Data
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  
  // Mood timeline
  const [moodData, setMoodData] = useState<Record<string, number>>({});
  const [moodLoading, setMoodLoading] = useState(false);

  // Load data
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        language: user.language || "en",
        timezone: user.timezone || "UTC",
      });
    }
  }, [user, companion]);

  // Fetch mood data when mood tab is active
  useEffect(() => {
    if (activeTab === "mood" && token) {
      fetchMoodData();
    }
  }, [activeTab, token]);

  // Fetch companion history when companion tab is active
  useEffect(() => {
    if (activeTab === "companion" && token) {
      getCompanionHistory().then(data => {
        setCompanionHistory(data.history);
        if (data.history.length > 0) setSelectedHistoryId(data.history[0].history_id);
      }).catch(() => {});
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (showCompanionPicker && companionCatalog.length === 0 && token) {
      setLoadingCatalog(true);
      getCompanionCatalog().then(data => {
        setCompanionCatalog(data.companions);
      }).catch(() => {}).finally(() => setLoadingCatalog(false));
    }
  }, [showCompanionPicker, token]);

  const fetchMoodData = async () => {
    if (!token) return;
    setMoodLoading(true);
    try {
      // Fetch messages to get emotion_tags
      const data = await getAllMessages(500);
      const messages = data.messages || [];
      
      // Aggregate emotion tags
      const emotions: Record<string, number> = {};
      messages.forEach((msg: any) => {
        if (msg.emotion_tags && Array.isArray(msg.emotion_tags)) {
          msg.emotion_tags.forEach((emotion: string) => {
            emotions[emotion] = (emotions[emotion] || 0) + 1;
          });
        }
      });
      setMoodData(emotions);
    } catch (err) {
      console.error("Failed to fetch mood data:", err);
    } finally {
      setMoodLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!token) return;
    try {
      const updatedUser = await updateProfile(profileForm);
      await refreshUser();
      toast({ title: "Saved", description: "Profile updated successfully" });
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const handlePasswordChange = async () => {
    if (!securityForm.current_password || !securityForm.new_password) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (securityForm.new_password !== securityForm.confirm_password) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (securityForm.new_password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
   
    setChangingPassword(true);
    try {
      // This would need a backend endpoint - for now just toast
      toast({ title: "Coming soon", description: "Password change endpoint not yet implemented" });
    } catch (err) {
      console.error("Failed to change password:", err);
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOpenPicker = () => {
    setPickerSelectedId("");
    setPickerGenderFilter("all");
    setShowCompanionPicker(true);
  };

  const handleChangeCompanion = async (companionId: string) => {
    if (!token) return;
    setChangingCompanion(true);
    setShowCompanionPicker(false);
    try {
      const modeConvs = JSON.parse(localStorage.getItem("saya_mode_convs") || "{}");
      const currentConvId: string | undefined = modeConvs["friend"] || modeConvs["romantic"] || modeConvs["adult"] || undefined;
      const result = await changeCompanion(currentConvId, companionId);
      await refreshUser();
      localStorage.removeItem("saya_mode_convs");
      toast({ title: `Meet ${result.new_companion}!`, description: "Starting fresh with your new companion…" });
      setTimeout(() => router.push("/chat"), 1500);
    } catch (err: any) {
      const msg = err?.message || "Failed to change companion";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setChangingCompanion(false);
    }
  };

  const handleRestoreCompanion = async () => {
    if (!token || !selectedHistoryId) return;
    setRestoringCompanion(true);
    try {
      const result = await restoreCompanion(selectedHistoryId);
      await refreshUser();
      toast({ title: `Welcome back, ${result.companion_name}!`, description: "Restoring your chat…" });
      localStorage.removeItem("saya_mode_convs");
      if (result.conversation_id) {
        // Store the old conversation so the chat page loads it
        const modeConvs = { friend: result.conversation_id };
        localStorage.setItem("saya_mode_convs", JSON.stringify(modeConvs));
      }
      setTimeout(() => router.push(result.conversation_id ? "/chat" : "/chat?new=true"), 1500);
    } catch (err: any) {
      const msg = err?.message || "Failed to restore companion";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setRestoringCompanion(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please choose an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be under 5 MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      await refreshUser();
      toast({ title: "Avatar updated", description: "Your profile picture has been saved" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload avatar", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast({ title: "Error", description: "Type DELETE to confirm", variant: "destructive" });
      return;
    }
   
    setDeletingAccount(true);
    try {
      await deleteAccount();
      logout();
      router.push("/auth/login");
      toast({ title: "Account deleted", description: "Your account has been permanently removed" });
    } catch (err) {
      console.error("Failed to delete account:", err);
      toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
    }
  };

  const planLabels: Record<string, { label: string; color: string }> = {
    free: { label: "Free Trial", color: "dim" },
    companion: { label: "Companion", color: "purple" },
    gfbf: { label: "Romantic Companion", color: "pink" },
    adult: { label: "Adult Companion", color: "amber" },
    vip: { label: "VIP Bundle", color: "yellow" },
  };

  const currentPlan = subscription?.plan || "free";
  const planInfo = planLabels[currentPlan];

  // Emotion colors for gradient
  const emotionColors: Record<string, string> = {
    joy: "#10B981",
    happiness: "#10B981",
    excitement: "#F59E0B",
    love: "#EC4899",
    gratitude: "#8B5CF6",
    peace: "#14B8A6",
    sadness: "#6366F1",
    anxiety: "#F59E0B",
    fear: "#EF4444",
    anger: "#EF4444",
    frustration: "#F97316",
    loneliness: "#8B5CF6",
    hope: "#22C55E",
    calm: "#14B8A6",
    neutral: "#94A3B8",
  };

  const sortedEmotions = useMemo(() => 
    Object.entries(moodData).sort((a, b) => b[1] - a[1]),
  [moodData]);

  const maxCount = useMemo(() => 
    Math.max(...Object.values(moodData), 1),
  [moodData]);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <main className={cn(
        "main-content min-h-screen pb-12 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <TopNav onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <div className="max-w-4xl mx-auto px-4 pt-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              {/* Clickable avatar with permanent camera badge */}
              <label className="relative cursor-pointer" title="Change profile picture">
                <Avatar
                  src={user?.user_preferences?.avatar_url}
                  name={user?.full_name || user?.email}
                  size="xl"
                />
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-bg shadow-md"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                >
                  {uploadingAvatar
                    ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    : <Camera className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                />
              </label>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-text">{user?.full_name || "Friend"}</h1>
                  <Pill variant={planInfo.color as any}>{planInfo.label}</Pill>
                </div>
                <p className="text-dim text-sm mt-1">{user?.email}</p>
              </div>
            </div>
           
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-bg2/50 rounded-xl p-1 border border-border overflow-x-auto no-scrollbar">
              {[
                { id: "profile", label: "Profile", icon: User },
                { id: "companion", label: "Companion", icon: Heart },
                { id: "security", label: "Security", icon: Shield },
                { id: "mood", label: "Mood", icon: Activity },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 min-h-[40px]",
                    activeTab === tab.id
                      ? "bg-card text-text shadow-sm"
                      : "text-dim hover:text-text hover:bg-card/50"
                  )}
                >
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-text mb-6">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="full_name">Display Name</Label>
                      <Input
                        id="full_name"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <select
                          id="language"
                          value={profileForm.language}
                          onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                          className="input-field"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="ja">Japanese</option>
                          <option value="ko">Korean</option>
                          <option value="zh">Chinese</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <select
                          id="timezone"
                          value={profileForm.timezone}
                          onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                          className="input-field"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                          <option value="Australia/Sydney">Sydney</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-border">
                      <Button onClick={handleProfileSave} className="btn-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Companion Info Card */}
                {companion && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <Card className="p-6">
                      <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink" />
                        Your Companion
                      </h2>
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar name={companion.name} size="xl" />
                        <div>
                          <p className="text-xl font-bold text-text">{companion.name}</p>
                          <p className="text-dim text-sm">Mode: {companion.mode.replace("_", " ")}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* COMPANION TAB */}
            {activeTab === "companion" && (
              <motion.div
                key="companion"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Companion identity card */}
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-text mb-6 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink" />
                    Your Companion
                  </h2>
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar name={companion?.name || "S"} size="xl" />
                    <div>
                      <p className="text-xl font-bold text-text">{companion?.name || "—"}</p>
                      {companion?.personality_type && (
                        <p className="text-sm text-dim">{companion.personality_type}</p>
                      )}
                      {companion?.bio && (
                        <p className="text-xs text-muted mt-1 max-w-xs">{companion.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text">Relationship Length</p>
                        <p className="text-sm text-dim">Days together</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-extrabold text-gradient-brand">{companion?.relationship_length_days || 0}</p>
                        <p className="text-xs text-dim">days</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text">Current Stage</p>
                        <p className="text-sm text-dim">Your bond level</p>
                      </div>
                      <Pill variant="purple" className="capitalize">
                        {companion?.relationship_stage?.replace("_", " ") || "acquaintance"}
                      </Pill>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text">Communication Style</p>
                        <p className="text-sm text-dim">How she talks to you</p>
                      </div>
                      <Pill variant="pink">
                        {companion?.personality_calibration?.communication_style || "Balanced"}
                      </Pill>
                    </div>
                  </div>
                </Card>

                {/* Change companion card */}
                <Card className="p-6" style={{ border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.03)" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                      <RefreshCw className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-text mb-1">Change Companion</h3>
                      <p className="text-sm text-dim mb-4">
                        Browse all 20 companions and choose who you want to connect with next. Costs 300 coins.
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Button
                          onClick={handleOpenPicker}
                          disabled={changingCompanion}
                          className="btn-primary"
                        >
                          {changingCompanion ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Switching...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Choose Companion — 300{' '}
                              <span className="inline-block w-3.5 h-3.5 rounded-full align-middle ml-0.5" style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }} />
                            </>
                          )}
                        </Button>
                        <Link href="/coins" className="text-xs text-muted hover:text-purple transition-colors">
                          Get coins →
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Restore previous companion */}
                {companionHistory.length > 0 && (
                  <Card className="p-6" style={{ border: "1px solid rgba(236,72,153,0.2)", background: "rgba(236,72,153,0.03)" }}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #ec4899, #f59e0b)" }}>
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-text mb-1">Restore Previous Companion</h3>
                        <p className="text-sm text-dim mb-4">
                          Bring back an old companion and restore your chat history with them.
                        </p>

                        {/* Dropdown */}
                        <select
                          value={selectedHistoryId}
                          onChange={e => setSelectedHistoryId(e.target.value)}
                          className="input-field w-full mb-4"
                          disabled={restoringCompanion}
                        >
                          {companionHistory.map(entry => {
                            const date = new Date(entry.changed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                            return (
                              <option key={entry.history_id} value={entry.history_id}>
                                {entry.name}{entry.personality_type ? ` — ${entry.personality_type}` : ""} (had until {date})
                              </option>
                            );
                          })}
                        </select>

                        {/* Preview of selected */}
                        {selectedHistoryId && (() => {
                          const sel = companionHistory.find(h => h.history_id === selectedHistoryId);
                          return sel ? (
                            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-card2">
                              <Avatar name={sel.name} size="md" />
                              <div>
                                <p className="font-semibold text-text">{sel.name}</p>
                                <p className="text-xs text-dim">{sel.personality_type}</p>
                                {sel.conversation_id
                                  ? <p className="text-xs text-green mt-0.5">Chat history available</p>
                                  : <p className="text-xs text-muted mt-0.5">No saved chat — fresh start</p>
                                }
                              </div>
                            </div>
                          ) : null;
                        })()}

                        <div className="flex items-center gap-3 flex-wrap">
                          <Button
                            onClick={handleRestoreCompanion}
                            disabled={restoringCompanion || !selectedHistoryId}
                            className="btn-primary"
                            style={{ background: "linear-gradient(135deg, #ec4899, #f59e0b)" }}
                          >
                            {restoringCompanion ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Restoring...
                              </>
                            ) : (
                              <>
                                <Heart className="w-4 h-4 mr-2" />
                                Restore — 800{' '}
                                <span className="inline-block w-3.5 h-3.5 rounded-full align-middle ml-0.5" style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }} />
                              </>
                            )}
                          </Button>
                          <Link href="/coins" className="text-xs text-muted hover:text-purple transition-colors">
                            Get coins →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-text mb-6">Change Password</h2>
                  <p className="text-dim mb-6">Your password must be at least 8 characters long.</p>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="current_password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={securityForm.current_password}
                          onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-text"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="new_password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showNewPassword ? "text" : "password"}
                          value={securityForm.new_password}
                          onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-text"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={securityForm.confirm_password}
                          onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-text"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="btn-primary w-full"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </Card>

                {/* Account Deletion */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-bold text-text mb-6 flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red" />
                      Account Deletion (GDPR)
                    </h2>
                    <p className="text-dim mb-6">Permanently delete your account and all associated data.</p>
                   
                    <div className="p-4 bg-red/5 border-red/20 border rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Trash2 className="w-5 h-5 text-red" />
                            <p className="font-bold text-red">Delete Account</p>
                          </div>
                          <p className="text-sm text-dim">
                            Permanently delete your account and all associated data. This action cannot be undone.
                            All conversations, memories, and subscription data will be permanently removed.
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="w-full max-w-xs"
                          />
                          <Button
                            onClick={handleDeleteAccount}
                            disabled={deletingAccount || deleteConfirm !== "DELETE"}
                            className="btn-secondary w-full max-w-xs"
                            style={{ background: "rgba(220, 38, 38, 0.1)", borderColor: "rgba(220, 38, 38, 0.3)" }}
                          >
                            {deletingAccount ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete Account"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                   
                    <div className="p-4 bg-card2 rounded-xl border border-border mt-4">
                      <h4 className="font-semibold text-text mb-3">Your Rights (GDPR)</h4>
                      <ul className="space-y-2 text-sm text-dim">
                        <li>• Right to access your personal data</li>
                        <li>• Right to rectification of inaccurate data</li>
                        <li>• Right to erasure (right to be forgotten)</li>
                        <li>• Right to restrict processing</li>
                        <li>• Right to data portability</li>
                        <li>• Right to object to processing</li>
                        <li>• Right to withdraw consent at any time</li>
                      </ul>
                      <p className="text-xs text-muted mt-3">
                        Contact privacy@saya.app for any data requests. We respond within 30 days.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* MOOD TIMELINE TAB */}
            {activeTab === "mood" && (
              <motion.div
                key="mood"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Premium gate for free tier */}
                {currentPlan === "free" && (
                  <Card className="p-6 text-center mb-6" style={{ border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.05)" }}>
                    <Activity className="w-12 h-12 mx-auto mb-4 text-purple-500 opacity-50" />
                    <h3 className="text-xl font-bold text-text mb-2">Mood Timeline is a Premium Feature</h3>
                    <p className="text-dim mb-4">Unlock your emotional pattern visualization with Companion plan or higher.</p>
                    <Link href="/subscription">
                      <Button className="btn-primary">Upgrade to Unlock</Button>
                    </Link>
                    <p className="text-xs text-muted mt-3">Free Trial users can preview with sample data below.</p>
                  </Card>
                )}

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-text flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-500" />
                      Mood Timeline
                    </h2>
                    {moodLoading && <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />}
                  </div>

                  {moodLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    </div>
                  ) : sortedEmotions.length === 0 ? (
                    <div className="text-center py-16 text-dim">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium text-text mb-2">No mood data yet</p>
                      <p className="text-sm">Start chatting with Saya to build your emotional timeline.</p>
                      <p className="text-xs text-muted mt-2">Emotions are detected from your conversations and displayed here.</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {[
                          { label: "Total Emotions", value: Object.values(moodData).reduce((a, b) => a + b, 0), icon: HeartIcon, color: "#EC4899" },
                          { label: "Unique Emotions", value: Object.keys(moodData).length, icon: Brain, color: "#8B5CF6" },
                          { label: "Top Emotion", value: sortedEmotions[0]?.[0] || "—", icon: Star, color: "#F59E0B" },
                          { label: "Conversations", value: "—", icon: Zap, color: "#14B8A6" },
                        ].map((stat, i) => (
                          <div key={i} className="glass-card p-4 text-center" style={{ background: `rgba(${parseInt(stat.color.slice(1,3),16)},${parseInt(stat.color.slice(3,5),16)},${parseInt(stat.color.slice(5,7),16)},0.1)` }}>
                            <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
                            <p className="text-xl font-extrabold text-text">{typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}</p>
                            <p className="text-xs text-dim">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Bar Chart */}
                      <div className="space-y-4">
                        {sortedEmotions.slice(0, 12).map(([emotion, count], index) => {
                          const color = emotionColors[emotion] || "#8B5CF6";
                          const percentage = (count / maxCount) * 100;
                          return (
                            <motion.div
                              key={emotion}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                  <span className="text-sm font-medium text-text capitalize">{emotion}</span>
                                </div>
                                <span className="text-xs text-dim font-mono">{count}</span>
                              </div>
                              <div className="w-full h-3 rounded-full bg-bg2 overflow-hidden relative">
                                <motion.div
                                  className="h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.6, ease: "easeOut" }}
                                  style={{ background: `linear-gradient(90deg, ${color}, ${color}dd)` }}
                                />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1))" }} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Area chart placeholder */}
                      <div className="mt-8 p-4 bg-bg2/50 rounded-xl border border-border/50">
                        <p className="text-dim text-sm text-center">
                          <strong>Area chart view coming soon</strong> — This will show your emotional patterns over time (weekly/monthly trends).
                        </p>
                      </div>
                    </>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Companion Picker Modal */}
      <AnimatePresence>
        {showCompanionPicker && (() => {
          const filteredCatalog = pickerGenderFilter === "all"
            ? companionCatalog
            : companionCatalog.filter(c => c.gender === pickerGenderFilter);
          const pickerSelected = companionCatalog.find(c => c.id === pickerSelectedId);

          return (
            <motion.div
              key="picker-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowCompanionPicker(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-text">Choose Your Companion</h2>
                    <p className="text-xs text-dim mt-0.5">20 companions · 300 coins to switch</p>
                  </div>
                  <button
                    onClick={() => setShowCompanionPicker(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-dim hover:text-text hover:bg-card transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Gender filter */}
                <div className="px-6 pt-4 pb-2 flex gap-2 flex-shrink-0">
                  {(["all", "female", "male"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setPickerGenderFilter(f)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                        pickerGenderFilter === f
                          ? "text-white"
                          : "text-dim hover:text-text bg-card hover:bg-card2"
                      )}
                      style={pickerGenderFilter === f
                        ? { background: f === "female" ? "linear-gradient(135deg, #ec4899, #8b5cf6)" : f === "male" ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "linear-gradient(135deg, #8b5cf6, #ec4899)" }
                        : {}
                      }
                    >
                      {f === "all" ? "All" : f === "female" ? "♀ Female" : "♂ Male"}
                    </button>
                  ))}
                </div>

                {/* Companion grid */}
                <div className="overflow-y-auto flex-1 px-6 pb-4">
                  {loadingCatalog ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                      {filteredCatalog.map(c => {
                        const isSelected = c.id === pickerSelectedId;
                        const isFemale = c.gender === "female";
                        const isLocked = !c.available;
                        return (
                          <button
                            key={c.id}
                            onClick={() => c.available && setPickerSelectedId(c.id)}
                            disabled={isLocked}
                            className={cn(
                              "relative text-left p-4 rounded-xl border transition-all",
                              isLocked
                                ? "opacity-40 cursor-not-allowed border-border bg-card"
                                : isSelected
                                  ? "border-transparent shadow-lg"
                                  : "border-border bg-card hover:border-purple/50 hover:bg-card2 cursor-pointer"
                            )}
                            style={isSelected ? {
                              border: "1px solid transparent",
                              background: `linear-gradient(var(--card), var(--card)) padding-box, linear-gradient(135deg, ${isFemale ? "#ec4899, #8b5cf6" : "#3b82f6, #06b6d4"}) border-box`,
                            } : {}}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar name={c.name} size="md" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-text">{c.name}</span>
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{
                                      background: isFemale ? "rgba(236,72,153,0.15)" : "rgba(59,130,246,0.15)",
                                      color: isFemale ? "#ec4899" : "#3b82f6",
                                    }}
                                  >
                                    {isFemale ? "♀" : "♂"} {c.gender}
                                  </span>
                                  {c.locked_reason === "current" && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple/20 text-purple font-medium">Current</span>
                                  )}
                                  {c.locked_reason === "in_history" && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">Restore to unlock</span>
                                  )}
                                </div>
                                <p className="text-xs text-purple mt-0.5 font-medium">{c.personality_type}</p>
                                <p className="text-xs text-dim mt-1 line-clamp-2">{c.bio}</p>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                  style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-4 flex-shrink-0">
                  <div className="text-sm text-dim">
                    {pickerSelected
                      ? <span>Selected: <span className="font-semibold text-text">{pickerSelected.name}</span> · {pickerSelected.personality_type}</span>
                      : "Select a companion to continue"
                    }
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => setShowCompanionPicker(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => pickerSelectedId && handleChangeCompanion(pickerSelectedId)}
                      disabled={!pickerSelectedId || changingCompanion}
                      className="btn-primary"
                    >
                      {changingCompanion ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Switching...</>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Choose {pickerSelected?.name || "Companion"} — 300{' '}
                          <span className="inline-block w-3.5 h-3.5 rounded-full align-middle ml-0.5" style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }} />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}