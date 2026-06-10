"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Message } from "@/types";
import { ChevronDown, Copy, Check } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showTime, setShowTime] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";
  const time = formatDate(message.created_at);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
          <span className="text-white font-bold text-sm">S</span>
        </div>
      )}

      <div className={cn("max-w-[85%] relative", isUser ? "order-2" : "order-1")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 relative",
            isUser
              ? "rounded-br-md"
              : "rounded-bl-md"
          )}
          style={{
            background: isUser
              ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
              : "#1a1a27",
            borderLeft: isUser ? "none" : "3px solid transparent",
            borderImage: isUser ? "none" : "linear-gradient(135deg, #8b5cf6, #ec4899) 1",
          }}
        >
          <div className={cn("whitespace-pre-wrap break-words", isUser ? "text-white" : "text-text")}>
            {message.content}
          </div>

          {/* Hover actions */}
          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-1">
            <button
              onClick={copyToClipboard}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={copied ? "Copied!" : "Copy message"}
            >
              {copied ? <Check className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4 text-dim" />}
            </button>
          </div>
        </div>

        {/* Timestamp & Emotion tags */}
        <div className={cn("flex items-center gap-2 mt-1.5 px-1", isUser ? "justify-end" : "justify-start")}>
          <span className="text-xs text-muted">{time}</span>

          {message.emotion_tags && message.emotion_tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {message.emotion_tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}
                >
                  {tag}
                </span>
              ))}
              {message.emotion_tags.length > 3 && (
                <span className="px-2 py-0.5 rounded-full text-xs text-muted">
                  +{message.emotion_tags.length - 3}
                </span>
              )}
            </div>
          )}

          {showTime && (
            <span className="text-xs text-muted">{formatDate(message.created_at)}</span>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 bg-card2">
          <span className="text-dim font-bold text-sm">{message.content ? "U" : "?"}</span>
        </div>
      )}
    </div>
  );
}