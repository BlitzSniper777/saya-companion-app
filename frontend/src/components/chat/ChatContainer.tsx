"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageInput } from "./MessageInput";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import type { Message, Conversation } from "@/types";
import { X, ChevronDown, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Pill } from "@/components/ui/Pill";

interface ChatContainerProps {
  conversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  typing: boolean;
  crisisDetected: boolean;
  crisisResources: Array<{ name: string; contact: string; url: string }>;
  dailyMessageCount?: number;
  dailyMessageLimit?: number;
  onSendMessage: (message: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export interface ChatContainerHandle {
  scrollToBottom: () => void;
}

export const ChatContainer = forwardRef<ChatContainerHandle, ChatContainerProps>(
  ({ conversation, messages, isStreaming, typing, crisisDetected, crisisResources, dailyMessageCount, dailyMessageLimit, onSendMessage, onNewConversation, onDeleteConversation }, ref) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const { subscription } = useAuth();

    useImperativeHandle(ref, () => ({
      scrollToBottom: () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      },
    }));

    // Scroll to bottom on new messages
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isStreaming]);

    const isFreeTier = subscription?.plan === "free";
    const atLimit = isFreeTier && dailyMessageCount && dailyMessageLimit && dailyMessageCount >= dailyMessageLimit;
    const nearLimit = isFreeTier && dailyMessageCount && dailyMessageLimit && dailyMessageCount >= dailyMessageLimit - 5;

    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Crisis Banner */}
        <AnimatePresence>
          {crisisDetected && crisisResources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="crisis-banner mx-4 mb-4 flex items-start gap-3"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-red flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red">If you're going through something serious, help is available.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {crisisResources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple hover:underline flex items-center gap-1"
                    >
                      {resource.name}: {resource.contact}
                    </a>
                  ))}
                </div>
              </div>
              <button className="btn-ghost p-1 text-dim hover:text-text" aria-label="Dismiss crisis banner">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Free Tier Warning */}
        <AnimatePresence>
          {nearLimit && !atLimit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="free-tier-warning mx-4 mb-4 flex items-center justify-between"
            >
              <span>You've used {dailyMessageCount} of {dailyMessageLimit} messages today.</span>
              <a href="/subscription" className="btn-primary text-sm px-4 py-1.5">Upgrade for unlimited</a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center text-dim py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                <span className="text-2xl">✨</span>
              </div>
              <p className="text-lg font-medium text-text mb-1">Welcome to your chat with Saya</p>
              <p className="text-sm">Start a conversation — she's here to listen</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <MessageBubble message={message} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {typing && (
            <TypingIndicator />
          )}

          {/* Streaming indicator */}
          {isStreaming && !typing && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
            <TypingIndicator text="Saya is responding..." />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Upgrade Overlay for Free Tier at Limit */}
        {atLimit && (
          <div className="upgrade-overlay z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card max-w-md w-full mx-4 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899)" }}>
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-text mb-2">Daily limit reached</h3>
              <p className="text-dim mb-6">You've used all {dailyMessageLimit} messages for today. Upgrade for unlimited conversations.</p>
              <a href="/subscription" className="btn-primary w-full" onClick={(e) => { e.stopPropagation(); }}>
                Upgrade Now
              </a>
              <p className="text-xs text-muted mt-4">Resets at midnight UTC</p>
            </motion.div>
          </div>
        )}

        {/* Message Input */}
        <MessageInput
          onSendMessage={onSendMessage}
          disabled={atLimit || isStreaming}
          dailyMessageCount={dailyMessageCount}
          dailyMessageLimit={dailyMessageLimit}
          isFreeTier={isFreeTier}
        />
      </div>
    );
  }
);

ChatContainer.displayName = "ChatContainer";