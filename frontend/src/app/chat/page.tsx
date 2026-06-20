"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { ChatContainer, ChatContainerHandle } from "@/components/chat/ChatContainer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { MessageInput } from "@/components/chat/MessageInput";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  listConversations,
  createConversation,
  getConversation,
  getConversationMessages,
  deleteConversation,
  streamChat,
  getSubscription,
  getCompanion,
  switchCompanionMode,
  getProfile,
  toggleAdultMode,
} from "@/lib/api";
import type { Conversation, Message, ChatChunk, Subscription } from "@/types";
import { OnboardingRequest } from "@/types";
import { X, Plus, Trash2, MessageSquare, Search, ChevronDown, MoreVertical, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ConversationWithPreview = Conversation & { last_message_preview?: string };

const MODES = [
  { id: "friend",   label: "Friend",   emoji: "😊", plans: ["free", "companion", "gfbf", "adult", "vip"] },
  { id: "romantic", label: "Romantic", emoji: "💕", plans: ["gfbf", "vip"] },
  { id: "adult",    label: "Adult",    emoji: "🔥", plans: ["adult", "vip"] },
] as const;

export default function ChatPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, refreshUser, setSubscription } = useAuth();
  const { toast } = useToast();

  // State
  const [conversations, setConversations] = useState<ConversationWithPreview[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithPreview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [typing, setTyping] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [crisisResources, setCrisisResources] = useState<Array<{ name: string; contact: string; url: string }>>([]);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [dailyMessageLimit, setDailyMessageLimit] = useState(15);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [companionMode, setCompanionMode] = useState<"friend" | "romantic" | "adult">("friend");
  const [companionName, setCompanionName] = useState("Saya");
  const [plan, setPlan] = useState<string>("free");
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  // Persistent conversation ID per mode — each tab keeps its own chat history
  const [modeConvIds, setModeConvIds] = useState<Record<string, string>>({});
  const chatContainerRef = useRef<ChatContainerHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const readModeConvIds = (): Record<string, string> => {
    try { return JSON.parse(localStorage.getItem("saya_mode_convs") || "{}"); } catch { return {}; }
  };
  const writeModeConvId = (mode: string, convId: string) => {
    const next = { ...readModeConvIds(), [mode]: convId };
    localStorage.setItem("saya_mode_convs", JSON.stringify(next));
    setModeConvIds(next);
  };

  // Read ?new=true from URL once at mount — use ref so URL changes don't recreate loadConversations
  const shouldCreateNewRef = useRef(
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("new") === "true"
      : false
  );

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const [data, comp, sub, userRes] = await Promise.all([
        listConversations(),
        getCompanion(),
        getSubscription(),
        getProfile(),
      ]);

      setConversations(data);
      setOnboardingCompleted(userRes.onboarding_completed || false);
      if (!userRes.onboarding_completed) { router.push("/onboarding"); return; }

      const currentMode = (comp.mode as "friend" | "romantic" | "adult") || "friend";
      setCompanionMode(currentMode);
      setCompanionName(comp.name || "Saya");
      setPlan(sub.plan || "free");
      setDailyMessageCount(sub.daily_message_count);
      setDailyMessageLimit(sub.daily_message_limit);

      const stored = readModeConvIds();
      setModeConvIds(stored);

      // Restore the conversation for the current mode, or pick the first/create one
      const storedId = stored[currentMode];
      const target = storedId ? data.find(c => c.id === storedId) : null;

      if (target) {
        setCurrentConversation(target);
        const convData = await getConversation(target.id);
        setMessages(convData.messages);
        setIsLoading(false);
      } else {
        // No stored conversation for this mode — always create a fresh one.
        // Do NOT auto-pick data[0]: it could belong to a different mode (e.g. adult).
        setIsLoading(false);
        await handleNewChat(currentMode);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, router]);

  // Check onboarding on user state change
  useEffect(() => {
    if (token) {
      getProfile().then(userRes => {
        setOnboardingCompleted(userRes.onboarding_completed || false);
        if (!userRes.onboarding_completed) {
          router.push("/onboarding");
        }
      }).catch(() => {});
    }
  }, [token, router]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Switch mode tab — loads or creates that mode's persistent conversation
  const handleTabSwitch = async (mode: "friend" | "romantic" | "adult") => {
    if (mode === companionMode || isStreaming) return;

    try {
      await switchCompanionMode(mode);
    } catch (err: any) {
      toast({ title: "Can't switch mode", description: err?.message, variant: "destructive" });
      return;
    }

    setCompanionMode(mode);
    const modeLabel = { friend: "Friend Chat", romantic: "Romantic Chat", adult: "Adult Chat" }[mode];
    toast({
      title: mode === "friend" ? "Friend mode 😊" :
             mode === "romantic" ? `${companionName} is now your partner 💕` :
             "Intimate mode 🔥",
    });

    // Load this mode's stored conversation, or create a new one
    const stored = readModeConvIds();
    const storedId = stored[mode];
    const found = storedId ? conversations.find(c => c.id === storedId) : null;

    if (found) {
      setCurrentConversation(found);
      setIsLoading(true);
      try {
        const data = await getConversation(found.id);
        setMessages(data.messages);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // No stored conversation for this mode yet — create one
    try {
      const conv = await createConversation(modeLabel);
      writeModeConvId(mode, conv.id);
      setConversations(prev => [conv, ...prev]);
      setCurrentConversation(conv);
      setMessages([]);
    } catch {
      toast({ title: "Error", description: "Failed to create conversation", variant: "destructive" });
    }
  };

  // Silently refresh messages when conversation changes (no spinner — isLoading is managed by loadConversations)
  useEffect(() => {
    if (!currentConversation || !token) return;
    getConversation(currentConversation.id)
      .then((data) => {
        setMessages(data.messages);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      });
  }, [currentConversation, token]);

  const handleNewChat = async (forMode?: string | React.MouseEvent) => {
    if (forMode && typeof forMode !== "string") forMode = undefined;
    if (!token) return;
    try {
      const title = newChatTitle || (forMode ? { friend: "Friend Chat", romantic: "Romantic Chat", adult: "Adult Chat" }[forMode] : undefined) || "New conversation";
      const conv = await createConversation(title);
      if (forMode) writeModeConvId(forMode, conv.id);
      setConversations((prev) => [conv, ...prev]);
      setCurrentConversation(conv);
      setMessages([]);
      setNewChatTitle("");
      setShowNewChatModal(false);
      const sub = await getSubscription();
      setDailyMessageCount(sub.daily_message_count);
      setDailyMessageLimit(sub.daily_message_limit);
      router.push(`/chat`);
    } catch (err) {
      console.error("Failed to create conversation:", err);
      toast({ title: "Error", description: "Failed to create new conversation", variant: "destructive" });
    }
  };

  const handleSelectConversation = (conv: ConversationWithPreview) => {
    setCurrentConversation(conv);
    router.push(`/chat`);
  };

  const handleDeleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
      toast({ title: "Deleted", description: "Conversation removed" });
    } catch (err) {
      console.error("Failed to delete:", err);
      toast({ title: "Error", description: "Failed to delete conversation", variant: "destructive" });
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!currentConversation || isStreaming) return;

    setIsStreaming(true);
    setTyping(true);
    
    // Add user message optimistically
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation.id,
      user_id: user?.id || "",
      role: "user",
      content: message,
      emotion_tags: [],
      topic_tags: [],
      token_count: message.split(" ").length,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    let assistantMessage = "";
    let finalMessageId = "";
    let finalConversationId = "";
    
    try {
      for await (const chunk of streamChat(currentConversation.id, message)) {
        if (chunk.type === "chunk" && chunk.content) {
          assistantMessage += chunk.content;
          // Update last message if it's assistant, or add new
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant" && last.id.startsWith("temp-")) {
              return [...prev.slice(0, -1), { ...last, content: assistantMessage }];
            }
            return [...prev, {
              id: `temp-${Date.now()}`,
              conversation_id: currentConversation.id,
              user_id: user?.id || "",
              role: "assistant",
              content: assistantMessage,
              emotion_tags: [],
              topic_tags: [],
              token_count: 0,
              metadata: {},
              created_at: new Date().toISOString(),
            }];
          });
        } else if (chunk.type === "complete") {
          finalMessageId = chunk.message_id || "";
          finalConversationId = chunk.conversation_id || "";
          setTyping(false);
          
          // Refresh messages to get proper IDs
          if (finalConversationId) {
            const convData = await getConversation(finalConversationId);
            setMessages(convData.messages);
          }
        } else if (chunk.type === "crisis") {
          setCrisisDetected(true);
          setCrisisResources(chunk.resources || []);
        } else if (chunk.type === "error") {
          toast({ title: "Error", description: chunk.error || "Chat failed", variant: "destructive" });
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsStreaming(false);
      setTyping(false);
    }
  };

  const handleSidebarToggle = () => setSidebarCollapsed(!sidebarCollapsed);

  // Format date for group headers
  const getDateGroup = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) return "Last 7 days";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">Welcome back</h2>
          <p className="text-dim mb-6">Sign in to continue your conversation with Saya</p>
          <a href="/auth/login" className="btn-primary w-full">
            Sign In
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar — supports mobile drawer via mobileOpen */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Mode Tabs — fixed below TopNav, always visible regardless of scroll */}
      <div className={cn(
        "fixed top-14 left-0 right-0 z-30 h-12",
        "border-b border-border/60 bg-bg/95 backdrop-blur-sm",
        "transition-[left] duration-300",
        sidebarCollapsed ? "lg:left-16" : "lg:left-64"
      )}>
        <div className="flex items-center h-full px-1">
          {MODES.map(({ id, label, emoji, plans }) => {
            const available = plans.includes(plan as any);
            const active = companionMode === id;
            return (
              <button
                key={id}
                onClick={() => available && handleTabSwitch(id as any)}
                disabled={!available}
                title={available ? `Switch to ${label} mode` : "Requires a higher plan"}
                className={cn(
                  "flex items-center gap-1.5 px-4 h-full text-sm font-medium transition-all border-b-2 min-w-[80px]",
                  active
                    ? "border-purple text-purple"
                    : available
                      ? "border-transparent text-dim hover:text-text hover:border-border"
                      : "border-transparent text-muted/40 cursor-not-allowed"
                )}
              >
                <span className="text-base leading-none">{emoji}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content — pt-[104px] = 56px nav + 48px tabs */}
      <main className={cn(
        "flex flex-col h-screen overflow-hidden transition-all duration-300",
        "pt-[104px]",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Top Nav (fixed) */}
        <TopNav onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        {/* Chat Area — fills remaining height */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {currentConversation ? (
            <ChatContainer
              ref={chatContainerRef}
              conversation={currentConversation}
              messages={messages}
              isStreaming={isStreaming}
              typing={typing}
              crisisDetected={crisisDetected}
              crisisResources={crisisResources}
              dailyMessageCount={dailyMessageCount}
              dailyMessageLimit={dailyMessageLimit}
              onSendMessage={handleSendMessage}
              onNewConversation={handleNewChat}
              onDeleteConversation={handleDeleteConversation}
              companionMode={companionMode}
              companionName={companionName}
              onMessagesChanged={async () => {
                if (currentConversation) {
                  const convData = await getConversation(currentConversation.id);
                  setMessages(convData.messages);
                }
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-text mb-2">No conversation selected</h3>
                <p className="text-dim mb-6">Start a new chat or select one from the sidebar</p>
                <button onClick={handleNewChat} className="btn-primary">
                  <Plus className="w-5 h-5 mr-2" />
                  New Conversation
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-text mb-4">New Conversation</h3>
              <input
                type="text"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Conversation title (optional)"
                className="input-field mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewChat}
                  className="btn-primary flex-1"
                  disabled={isStreaming}
                >
                  Start Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}