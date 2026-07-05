"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export interface ExportAction {
  id: string;
  label: string;
  hint?: string;
  onSelect: () => void;
}

/**
 * Compact toolbar dropdown of export / import actions (CSV, PNG, scenario JSON…).
 * Click-away and Esc close it; the lab supplies the actions. Presentational shell
 * meant to sit inside a <LabToolbar>.
 */
export function ExportMenu({ actions, label = "Export", className }: {
  actions: ExportAction[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Export or import this scenario"
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-slatey-300 transition-colors hover:border-primary/40 hover:text-ink"
      >
        <Download className="h-3.5 w-3.5" /> {label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="animate-fade-in absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-card">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); a.onSelect(); }}
              className="flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left text-xs text-slatey-300 transition-colors hover:bg-slate-50 hover:text-ink"
            >
              <span className="font-medium">{a.label}</span>
              {a.hint && <span className="text-[10px] leading-tight text-slatey-500">{a.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
