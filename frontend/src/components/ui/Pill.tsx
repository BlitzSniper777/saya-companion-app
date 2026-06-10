"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "purple" | "pink" | "teal" | "amber" | "green" | "red" | "dim";
  size?: "sm" | "md";
}

export const Pill = forwardRef<HTMLSpanElement, PillProps>(
  ({ className, variant = "purple", size = "md", children, ...props }, ref) => {
    const variants = {
      purple: "badge-purple",
      pink: "badge-pink",
      teal: "badge-teal",
      amber: "badge-amber",
      green: "badge-green",
      red: "badge-red",
      dim: "badge-dim",
    };

    const sizes = {
      sm: "px-2.5 py-0.5 text-xs",
      md: "px-3 py-1 text-xs",
    };

    return (
      <span
        ref={ref}
        className={cn("pill", variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Pill.displayName = "Pill";