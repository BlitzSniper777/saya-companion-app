"use client";

import { HTMLAttributes, ReactNode } from "react";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
}

export type ToastActionElement = ReactNode;
