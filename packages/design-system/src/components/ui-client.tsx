"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Modal } from "./Modal";
import { createHelpDismissal } from "../lib/help";

export function MetricTooltip({ text, label = "this metric", className }: { text: string; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  const [portal, setPortal] = useState<Element | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const id = useId();
  const dismissal = useMemo(() => createHelpDismissal(
    () => pinned.current || Boolean(trigger.current?.contains(document.activeElement) || tip.current?.contains(document.activeElement)),
    () => setOpen(false),
  ), []);
  const show = () => { dismissal.cancel(); setOpen(true); };
  const leave = () => dismissal.schedule();
  useEffect(() => dismissal.cancel, [dismissal]);
  useEffect(() => {
    if (!open) return;
    setPortal(trigger.current?.closest("dialog") ?? document.body);
    const place = () => {
      const bounds = trigger.current?.getBoundingClientRect();
      if (!bounds) return;
      const width = Math.min(288, window.innerWidth - 24);
      const height = tip.current?.getBoundingClientRect().height ?? 100;
      setPosition({ left: Math.max(12, Math.min(window.innerWidth - width - 12, bounds.left + bounds.width / 2 - width / 2)), top: bounds.top - height - 8 >= 12 ? bounds.top - height - 8 : Math.min(bounds.bottom + 8, window.innerHeight - height - 12) });
    };
    place();
    const frame = requestAnimationFrame(place);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); if (tip.current?.contains(document.activeElement)) trigger.current?.focus(); dismissal.cancel(); pinned.current = false; setOpen(false); } };
    const outside = (event: PointerEvent) => { if (!trigger.current?.contains(event.target as Node) && !tip.current?.contains(event.target as Node)) { dismissal.cancel(); setOpen(false); pinned.current = false; } };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", onKey, true); document.removeEventListener("pointerdown", outside); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, text, dismissal]);
  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        ref={trigger}
        type="button"
        onMouseEnter={show}
        onMouseLeave={leave}
        onFocus={show}
        onBlur={leave}
        onClick={() => { dismissal.cancel(); pinned.current = !pinned.current; setOpen(pinned.current); }}
        onKeyDown={(event) => { if (event.key === "ArrowDown" && open && tip.current) { event.preventDefault(); tip.current.focus(); } }}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slatey-500 transition-colors hover:bg-primary-soft hover:text-primary"
        aria-label={`About ${label}`}
        aria-describedby={id}
        aria-expanded={open}
        aria-controls={open && portal ? id : undefined}
      >
        <Info aria-hidden className="h-4 w-4" />
      </button>
      {(!open || !portal) && <span id={id} className="sr-only">{text}</span>}
      {open && portal && createPortal(<span id={id} ref={tip} role="region" aria-label={`${label} help`} tabIndex={0} onFocus={show} onBlur={leave} onMouseEnter={show} onMouseLeave={leave}
        onKeyDown={(event) => { if (event.key === "Tab") { event.preventDefault(); event.stopPropagation(); trigger.current?.focus(); dismissal.cancel(); pinned.current = false; setOpen(false); } }}
        style={position} className="fixed z-[100] max-h-[70dvh] w-72 max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain rounded-lg border border-line bg-white px-3 py-2.5 text-sm leading-relaxed text-slatey-300 shadow-card focus:outline focus:outline-2 focus:outline-primary">
        {text}<span className="mt-2 block text-xs text-slatey-500">Arrow Down from the help button enters this panel. Scroll with arrow or Page keys; Tab or Escape returns to the button.</span>
      </span>, portal)}
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
  const groupId = useId();
  const selected = tabs.some((tab) => tab.id === active) ? active : tabs[0]?.id;
  return (
    <div className={className}>
      <div role="tablist" aria-label="Views" className="mb-4 flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
        {tabs.map((t, index) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${groupId}-tab-${t.id}`}
            aria-controls={`${groupId}-panel-${t.id}`}
            tabIndex={selected === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            aria-selected={selected === t.id}
            onKeyDown={(event) => {
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
              if (next < 0) return;
              event.preventDefault(); setActive(tabs[next].id); document.getElementById(`${groupId}-tab-${tabs[next].id}`)?.focus();
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selected === t.id ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => <div key={tab.id} role="tabpanel" id={`${groupId}-panel-${tab.id}`} aria-labelledby={`${groupId}-tab-${tab.id}`} tabIndex={0} hidden={selected !== tab.id}>{selected === tab.id ? tab.content : null}</div>)}
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
    <div role="group"
      className={cn("flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white p-2 shadow-card", className)}
      aria-label="Sections"
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          aria-pressed={active === t.key}
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
    </div>
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
  return (
    <Modal open={open} onClose={onClose} title={title} className="p-0" panelClassName="absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col border-l border-line bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`} className="rounded-md p-2 text-slatey-400 transition-colors hover:bg-slate-100 hover:text-ink"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
    </Modal>
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

