"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { Send, Mic, Paperclip, Smile, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  dailyMessageCount?: number;
  dailyMessageLimit?: number;
  isFreeTier?: boolean;
}

export function MessageInput({ onSendMessage, disabled, dailyMessageCount, dailyMessageLimit, isFreeTier }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [rows, setRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    const newRows = Math.min(Math.max(newValue.split("\n").length, 1), 8);
    setRows(newRows);
    textarea.style.height = `${newRows * 24 + 16}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSendMessage(value.trim());
      setValue("");
      setRows(1);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const charCount = value.length;
  const maxChars = 4000;
  const nearLimit = charCount > maxChars * 0.9;

  return (
    <div className="sticky bottom-0 z-20 p-4 border-t border-border bg-bg/95 backdrop-blur-xl">
      {/* Character count for free tier */}
      {isFreeTier && dailyMessageCount !== undefined && dailyMessageLimit !== undefined && (
        <div className="mb-3 flex items-center justify-between text-xs text-muted">
          <span>Messages today: {dailyMessageCount} / {dailyMessageLimit}</span>
          <span className={cn(nearLimit && "text-amber")}>
            {charCount} / {maxChars}
          </span>
        </div>
      )}

      <div className="relative">
        <div className="flex items-end gap-2">
          {/* Attachment button (disabled) */}
          <button
            type="button"
            disabled
            className="btn-ghost p-2 -ml-2"
            title="Coming soon"
          >
            <Paperclip className="w-5 h-5 text-muted" />
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? (isFreeTier && dailyMessageCount && dailyMessageLimit && dailyMessageCount >= dailyMessageLimit ? "Daily limit reached — upgrade for unlimited" : "Saya is typing...") : "Message Saya..."}
              className={cn(
                "input-field pr-16 min-h-[56px] max-h-[200px]",
                disabled && "opacity-50"
              )}
              disabled={disabled}
              rows={rows}
              aria-label="Message input"
            />

            {/* Emoji picker trigger */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-card2 transition-colors text-dim"
              aria-label="Emoji picker"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || !value.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-4 py-2 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Voice button (disabled for now) */}
          <button
            type="button"
            disabled
            className="btn-ghost p-2 -mr-2"
            title="Voice messages coming soon"
          >
            <Mic className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Emoji Picker (simplified) */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full left-0 right-0 mb-2 glass-card rounded-xl p-3 shadow-lg"
            >
              <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                {[
                  "😊", "😂", "😍", "😭", "😡", "😱", "🤔", "😴",
                  "👍", "👎", "❤️", "🔥", "✨", "🌟", "💫", "🎉",
                  "🌈", "☀️", "🌙", "⭐", "💜", "💙", "💚", "💛",
                  "🤗", "🙏", "👏", "🤝", "💪", "🧠", "❤️‍🩹", "🕊️",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setValue(value + emoji);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className="text-2xl hover:scale-125 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}