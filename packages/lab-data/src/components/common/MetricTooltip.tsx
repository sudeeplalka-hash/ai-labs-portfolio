"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@data/lib/cn";

export function MetricTooltip({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-slatey-500 transition-colors hover:text-slatey-300"
        aria-label="More information"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-lg border border-line bg-white px-3 py-2 text-xs leading-relaxed text-slatey-300 shadow-card">
          {text}
        </span>
      )}
    </span>
  );
}
