"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
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
} from "@/lib/api";
import type { Conversation, Message, ChatChunk, Subscription } from "@/types";
import { X, Plus, Trash2, MessageSquare, Search, ChevronDown, MoreVertical } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ConversationWithPreview = Conversation & { last_message_preview?: string };

export default function ChatPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, refreshUser } = useAuth();
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
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const chatContainerRef = useRef<ChatContainerHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Read ?new=true from URL without useSearchParams (avoids Suspense requirement)
  const shouldCreateNew = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("new") === "true"
    : false;

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await listConversations();
      setConversations(data);
      
      // Auto-select first conversation or create new
      if (data.length > 0 && !currentConversation) {
        const firstConv = data[0];
        setCurrentConversation(firstConv);
        const convData = await getConversation(firstConv.id);
        setMessages(convData.messages);
        const sub = await getSubscription();
        setDailyMessageCount(sub.daily_message_count);
        setDailyMessageLimit(sub.daily_message_limit);
      } else if (data.length === 0 || shouldCreateNew) {
        await handleNewChat();
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      setIsLoading(false);
    }
  }, [token, currentConversation, shouldCreateNew]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversation || !token) return;
    setIsLoading(true);
    getConversation(currentConversation.id)
      .then((data) => {
        setMessages(data.messages);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setIsLoading(false);
      });
  }, [currentConversation, token]);

  const handleNewChat = async () => {
    if (!token) return;
    try {
      const title = newChatTitle || "New conversation";
      const conv = await createConversation(title);
      
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
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
      />
      
      {/* Main Content */}
      <main className={cn("main-content transition-all duration-300", sidebarCollapsed && "ml-16")}>
        {/* Top Nav */}
        <TopNav onMenuClick={handleSidebarToggle} />
        
        {/* Chat Area */}
        <div className="p-4 md:p-6 flex-1">
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
            />
          ) : (
            // Empty state when no conversation selected
            <div className="flex-1 flex items-center justify-center">
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