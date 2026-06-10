"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { updateProfile, deleteAccount, completeOnboarding, getCompanion, updateCompanion, getSubscription, getPlans } from "@/lib/api";
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
  User, Mail, Lock, Shield, Bell, Palette, Heart, CreditCard, Settings, Trash2, LogOut, Eye, EyeOff, Save, Loader2, X, Check, Star, Sparkles
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, companion, subscription, token, logout, refreshUser, setCompanion, setSubscription } = useAuth();
  const { toast } = useToast();

  // Tabs
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences" | "data">("profile");
  
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
  
  // Preferences
  const [companionName, setCompanionName] = useState(companion?.name || "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyOutreach, setDailyOutreach] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  
  // Data
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Load data
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        language: user.language || "en",
        timezone: user.timezone || "UTC",
      });
    }
    if (companion) {
      setCompanionName(companion.name);
    }
  }, [user, companion]);

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

  const handleCompanionNameSave = async () => {
    if (!token || !companion) return;
    if (!companionName.trim()) {
      toast({ title: "Error", description: "Companion name cannot be empty", variant: "destructive" });
      return;
    }
    
    setSavingPreferences(true);
    try {
      const updated = await updateCompanion({ name: companionName.trim() });
      setCompanion(updated);
      toast({ title: "Saved", description: `Companion name changed to ${companionName}` });
    } catch (err) {
      console.error("Failed to update companion:", err);
      toast({ title: "Error", description: "Failed to update companion name", variant: "destructive" });
    } finally {
      setSavingPreferences(false);
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
    free: { label: "Free", color: "dim" },
    companion: { label: "Companion", color: "purple" },
    gfbf: { label: "GF/BF", color: "pink" },
    adult: { label: "Adult", color: "amber" },
  };

  const currentPlan = subscription?.plan || "free";
  const planInfo = planLabels[currentPlan];

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Nav */}
      <header className="nav-bar">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
              style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="nav-brand text-lg">Saya</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-dim">
              {user?.full_name || user?.email}
            </span>
            <button onClick={logout} className="btn-ghost p-2 text-dim hover:text-red">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16 min-h-screen pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <Avatar name={user?.full_name || user?.email} size="xl" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-text">{user?.full_name || "Friend"}</h1>
                  <Pill variant={planInfo.color as any}>{planInfo.label}</Pill>
                </div>
                <p className="text-dim text-sm mt-1">{user?.email}</p>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-bg2/50 rounded-xl p-1 border border-border">
              {[
                { id: "profile", label: "Profile", icon: User },
                { id: "security", label: "Security", icon: Shield },
                { id: "preferences", label: "Preferences", icon: Heart },
                { id: "data", label: "Data & Privacy", icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-card text-text shadow-sm"
                      : "text-dim hover:text-text hover:bg-card/50"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
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
              </motion.div>
            )}

            {activeTab === "preferences" && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-text mb-6 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink" />
                    Companion Preferences
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="companion_name">Companion Name</Label>
                      <Input
                        id="companion_name"
                        value={companionName}
                        onChange={(e) => setCompanionName(e.target.value)}
                        placeholder="Companion's name"
                      />
                      <p className="text-xs text-muted mt-1">This changes how your companion introduces themselves.</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text">Push Notifications</p>
                        <p className="text-sm text-dim">Receive notifications when Saya sends a message</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationsEnabled}
                          onChange={(e) => setNotificationsEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-card2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text">Daily Morning Outreach</p>
                        <p className="text-sm text-dim">Saya messages you each morning (Companion tier+)</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dailyOutreach}
                          onChange={(e) => setDailyOutreach(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-card2 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple"></div>
                      </label>
                    </div>
                    
                    <Button onClick={handleCompanionNameSave} disabled={savingPreferences} className="btn-primary w-full sm:w-auto">
                      {savingPreferences ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "data" && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6">
                  <h2 className="text-lg font-bold text-text mb-6">Data & Privacy</h2>
                  <p className="text-dim mb-6">Manage your personal data and account deletion.</p>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-card2 rounded-xl border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text">Export Your Data</p>
                          <p className="text-sm text-dim">Download a copy of all your conversations and preferences</p>
                        </div>
                        <Button variant="secondary" disabled>
                          <span className="text-sm">Coming Soon</span>
                        </Button>
                      </div>
                    </div>
                    
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
                    
                    <div className="p-4 bg-card2 rounded-xl border border-border">
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
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}