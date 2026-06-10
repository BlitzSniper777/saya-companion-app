"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  text?: string;
  className?: string;
}

export function TypingIndicator({ text = "Saya is typing...", className }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn("flex items-center gap-3 px-1", className)}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
        <span className="text-white font-bold text-sm">S</span>
      </div>

      <div className="flex items-center gap-1" style={{ background: "#1a1a27" }} role="status" aria-label={text}>
        <motion.div
          className="typing-dot"
          animate={{ scale: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="typing-dot"
          animate={{ scale: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="typing-dot"
          animate={{ scale: [0, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
        />
        <span className="text-xs text-dim ml-1">{text}</span>
      </div>
    </motion.div>
  );
}