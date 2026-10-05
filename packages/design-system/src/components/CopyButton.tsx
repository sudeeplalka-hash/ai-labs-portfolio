"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { copyToClipboard } from "../lib/export";
import { cn } from "../lib/cn";
import { Modal } from "./Modal";

export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <>
    <button type="button" onClick={async () => {
      if (timer.current) clearTimeout(timer.current);
      const success = await copyToClipboard(text);
      setCopied(success);
      if (success) timer.current = setTimeout(() => setCopied(false), 2400);
      else setFallback(true);
    }} className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slatey-300 hover:border-primary/50 hover:text-ink", className)}>
      {copied ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />} {copied ? "Copied" : label}
    </button>
    <span className="sr-only" role="status">{copied ? "Copied to clipboard" : ""}</span>
    <Modal open={fallback} onClose={() => setFallback(false)} title="Copy text manually" initialFocusRef={field} panelClassName="mx-auto mt-[5dvh] max-w-2xl rounded-xl border border-line bg-white p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Copy text manually</h2><button type="button" onClick={() => setFallback(false)} aria-label="Close copy text" className="rounded p-2"><X aria-hidden className="h-5 w-5" /></button></div>
      <p className="my-3 text-sm text-slatey-400">Clipboard access was unavailable. Select the text below and copy it with your browser or keyboard.</p>
      <textarea ref={field} aria-label="Text to copy" readOnly value={text} onFocus={(event) => event.target.select()} className="h-[min(45dvh,24rem)] w-full rounded-lg border border-line p-3 font-code text-sm" />
    </Modal>
  </>;
}
