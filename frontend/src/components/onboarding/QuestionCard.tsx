"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface QuestionCardProps {
  question: string;
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  selectedValue: string;
  onSelect: (value: string) => void;
  multiSelect?: boolean;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  showInput?: boolean;
  className?: string;
}

export function QuestionCard({
  question,
  options,
  selectedValue,
  onSelect,
  multiSelect = false,
  inputPlaceholder,
  inputValue,
  onInputChange,
  showInput = false,
  className,
}: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("w-full", className)}
    >
      <h3 className="text-xl font-bold text-text mb-6 text-center">{question}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                "relative p-5 rounded-2xl border-2 transition-all text-left h-full",
                isSelected
                  ? "border-purple bg-[rgba(139,92,246,0.1)] text-text"
                  : "border-border hover:border-purple/50 hover:bg-card2 text-dim"
              )}
            >
              {option.icon && (
                <div className="absolute top-3 right-3 w-5 h-5">
                  {option.icon}
                </div>
              )}
              <span className="font-medium">{option.label}</span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      {showInput && (
        <div className="mt-4">
          <input
            type="text"
            value={inputValue || ""}
            onChange={(e) => onInputChange?.(e.target.value)}
            placeholder={inputPlaceholder}
            className="input-field text-center text-lg font-medium"
            autoFocus
          />
        </div>
      )}
    </motion.div>
  );
}