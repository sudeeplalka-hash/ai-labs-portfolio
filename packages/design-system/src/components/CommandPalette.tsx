"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import { cn } from "../lib/cn";
import { filterCommands, type Command } from "../lib/command";

/**
 * ⌘K / Ctrl-K command palette. Fuzzy-filtered (see filterCommands), fully keyboard
 * driven (↑/↓ to move, Enter to run, Esc to close) and screen-reader labelled. The
 * lab supplies the command list — navigate to a lab, run/reset, copy link, export,
 * toggle assumptions. Self-contained: mount one per lab.
 */
export function CommandPalette({ commands, hotkey = true }: { commands: Command[]; hotkey?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => { clearTimeout(t); document.body.style.overflow = ""; };
    }
    document.body.style.overflow = "";
  }, [open]);

  const results = useMemo(() => filterCommands(query, commands), [query, commands]);
  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  const run = (c: Command | undefined) => { if (!c) return; setOpen(false); c.run(); };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); run(results[active]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="animate-fade-in absolute left-1/2 top-24 w-[min(92vw,34rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-white shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search className="h-4 w-4 shrink-0 text-slatey-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a lab or run a command…"
            aria-label="Command palette search"
            className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-slatey-500"
          />
          <kbd className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] font-medium text-slatey-500">esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-1.5" role="listbox" aria-label="Commands">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-slatey-500">No matching commands.</li>
          )}
          {results.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => run(c)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  i === active ? "bg-primary/10 text-ink" : "text-slatey-300 hover:bg-slate-50",
                )}
              >
                <span className="flex-1 truncate">{c.label}</span>
                {c.group && <span className="shrink-0 text-[10px] uppercase tracking-wide text-slatey-500">{c.group}</span>}
                {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slatey-500" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
