"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";

export interface ExportAction { id: string; label: string; hint?: string; onSelect: () => void | Promise<unknown>; }

/** Normal action buttons in a disclosure, with a predictable native Tab order. */
export function ExportMenu({ actions, label = "Export", className }: { actions: ExportAction[]; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [alignLeft, setAlignLeft] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return <div ref={ref} className={cn("relative", className)}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}
    onKeyDown={(event) => { if (open && event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } }}>
    <button ref={trigger} type="button" aria-disabled={busy} onClick={() => { if (busy) return; setError(""); setAlignLeft((trigger.current?.getBoundingClientRect().right ?? 0) < 276); setOpen((current) => !current); }} aria-expanded={open} aria-controls={id}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-slatey-300 hover:border-primary/50 hover:text-ink disabled:opacity-60">
      <Download aria-hidden className="h-4 w-4" /> {busy ? "Preparing…" : label}<ChevronDown aria-hidden className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
    </button>
    {open && <div id={id} aria-label={`${label} actions`} className={cn("absolute z-40 mt-1 max-h-[60dvh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-line bg-white p-1 shadow-card", alignLeft ? "left-0" : "right-0")}>
      {actions.map((action) => <button key={action.id} type="button" disabled={busy} onClick={async () => {
        close(); setBusy(true); setError("");
        try { await action.onSelect(); } catch { setError("This action could not finish. Please try again."); }
        finally { setBusy(false); }
      }} className="flex min-h-11 w-full flex-col items-start gap-0.5 rounded px-3 py-2 text-left text-sm text-slatey-300 hover:bg-primary-soft hover:text-ink">
        <span className="font-medium">{action.label}</span>{action.hint && <span className="text-xs leading-relaxed text-slatey-500">{action.hint}</span>}
      </button>)}
    </div>}
    {error && <p role="alert" className="mt-2 max-w-64 text-xs text-rose-700">{error}</p>}
  </div>;
}
