"use client";

import { LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("label-field", className)}
      {...props}
    >
      {children}
    </label>
  )
);

Label.displayName = "Label";