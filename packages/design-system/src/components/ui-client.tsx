"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "../lib/cn";

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

export function Tabs({
  tabs,
  className,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  className?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            aria-pressed={active === t.id}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active === t.id ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}

/**
 * Controlled section navigation — a row of chip tabs that switch which section of
 * a single-page lab is shown (so a long lab reads as a few clear areas instead of
 * one endless scroll). The caller owns the active state and renders the section,
 * which lets depth/mode decide what's available. Styling matches the lab subnavs.
 */
export function SectionTabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <nav
      className={cn("flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white p-2 shadow-card", className)}
      aria-label="Sections"
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            active === t.key
              ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25"
              : "text-slatey-400 hover:bg-slate-50 hover:text-ink",
          )}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

