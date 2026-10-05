"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, CornerDownLeft, X } from "lucide-react";
import { cn } from "../lib/cn";
import { filterCommands, type Command } from "../lib/command";
import { Modal } from "./Modal";

export function CommandPalette({ commands, hotkey = true }: { commands: Command[]; hotkey?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const listId = `${id}-commands`;
  const results = useMemo(() => filterCommands(query, commands), [query, commands]);
  const selected = Math.max(0, Math.min(active, results.length - 1));
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);
  useEffect(() => { if (open) { setQuery(""); setActive(0); } }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${selected}`)?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [selected, open, id]);
  const run = (command: Command | undefined) => {
    if (!command) return;
    setOpen(false);
    window.setTimeout(() => command.run(), 0);
  };
  return <Modal open={open} onClose={() => setOpen(false)} title="Command palette" initialFocusRef={inputRef}
    panelClassName="mx-auto mt-[min(8dvh,4rem)] flex max-h-[calc(100dvh-3rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-white shadow-2xl">
    <div className="flex shrink-0 items-center gap-2 border-b border-line px-3">
      <Search aria-hidden className="h-4 w-4 shrink-0 text-slatey-500" />
      <input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0); }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && results.length) {
            event.preventDefault();
            setActive(event.key === "ArrowDown" ? Math.min(selected + 1, results.length - 1) : event.key === "ArrowUp" ? Math.max(selected - 1, 0) : event.key === "Home" ? 0 : results.length - 1);
          } else if (event.key === "Enter") { event.preventDefault(); run(results[selected]); }
        }}
        role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId}
        aria-activedescendant={results.length ? `${id}-option-${selected}` : undefined}
        aria-label="Find an artifact or action" autoComplete="off" placeholder="Find an artifact or action…"
        className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink placeholder:text-slatey-500" />
      <button type="button" onClick={() => setOpen(false)} aria-label="Close command palette" className="rounded-lg p-2 text-slatey-400 hover:bg-slate-100"><X aria-hidden className="h-5 w-5" /></button>
    </div>
    <div className="sr-only" role="status">{results.length ? `${results.length} matching commands` : "No matching commands. Try another search."}</div>
    <ul id={listId} role="listbox" aria-label="Commands" className="min-h-0 overflow-y-auto overscroll-contain p-1.5">
      {results.map((command, index) => <li id={`${id}-option-${index}`} key={command.id} role="option" aria-selected={index === selected}
        onPointerMove={(event) => { if (event.movementX || event.movementY) setActive(index); }} onMouseDown={(event) => event.preventDefault()} onClick={() => run(command)}
        className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm", index === selected ? "bg-primary-soft text-ink" : "text-slatey-300 hover:bg-slate-50")}>
        <span className="min-w-0 flex-1 break-words">{command.label}</span>
        {command.group && <span className="shrink-0 text-[11px] text-slatey-500">{command.group}</span>}
        {index === selected && <CornerDownLeft aria-hidden className="h-4 w-4 shrink-0 text-slatey-500" />}
      </li>)}
    </ul>
    {results.length === 0 && <p className="px-4 py-8 text-center text-sm text-slatey-500">No matching commands. Try another search.</p>}
    <p className="shrink-0 border-t border-line px-4 py-2 text-xs text-slatey-500">↑ ↓ select · Enter run · Escape close</p>
  </Modal>;
}
