"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
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
 * Controlled section navigation, a row of chip tabs that switch which section of
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

/* ---------------- Drawer ----------------
 * Right-side panel for advanced controls (e.g. an Assumptions editor). Overlay +
 * ESC to close; body scroll locked while open. Client-only. */
export function Drawer({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-label={title} className="animate-fade-in absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-line bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink">{title}</p>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slatey-400 transition-colors hover:bg-slate-100 hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Toasts (provider-free) ----------------
 * A tiny module-level pub/sub so any component can `toast("Copied")` without a
 * context provider. Mount <ToastHost/> once per lab (or globally). */
type ToastItem = { id: number; message: string };
let toastListeners: ((t: ToastItem) => void)[] = [];
let toastSeq = 0;
export function toast(message: string) {
  const item: ToastItem = { id: ++toastSeq, message };
  toastListeners.forEach((l) => l(item));
}
export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const listener = (t: ToastItem) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 2600);
    };
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter((l) => l !== listener); };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite" aria-atomic="true">
      {items.map((t) => (
        <div key={t.id} className="animate-fade-in pointer-events-auto rounded-lg bg-ink px-3.5 py-2 text-xs font-medium text-white shadow-lg">{t.message}</div>
      ))}
    </div>
  );
}

