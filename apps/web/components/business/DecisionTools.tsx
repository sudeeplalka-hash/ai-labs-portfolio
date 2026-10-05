"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Precise value entry and a bounded range share one labelled value. */
export function NumericControl({ label, value, min, max, step = 1, onChange, format = String, id }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (value: number) => void; format?: (value: number) => string; id?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return <div className="min-w-0 space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">{label}</label>
      <span className="font-mono text-sm tabular-nums text-ink">{format(value)}</span>
    </div>
    <div className="flex min-w-0 items-center gap-3">
      <input id={inputId} type="range" min={min} max={max} step={step} value={value}
        aria-valuetext={format(value)} onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-primary" />
      <input type="number" aria-label={`${label}, exact value`} min={min} max={max} step={step} value={value}
        onChange={(e) => { const n = e.currentTarget.valueAsNumber; if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n))); }}
        className="w-24 shrink-0 rounded-lg border border-line bg-white px-2 py-2 font-mono text-sm text-ink" />
    </div>
  </div>;
}

export function Delta({ value, format = String, label }: { value: number; format?: (n: number) => string; label?: string }) {
  return <span className="font-mono tabular-nums">{value > 0 ? "+" : value < 0 ? "−" : ""}{format(Math.abs(value))}{label ? ` ${label}` : ""}</span>;
}

export function EvidenceTable({ caption, headings, rows }: { caption: string; headings: string[]; rows: ReactNode[][] }) {
  return <details className="mt-3 rounded-lg border border-line bg-white p-3">
    <summary className="cursor-pointer text-sm font-semibold text-ink">{caption}</summary>
    <div className="mt-3 max-w-full overflow-x-auto" role="region" aria-label={caption} tabIndex={0}>
      <table className="data-table w-full"><caption className="sr-only">{caption}</caption><thead><tr>{headings.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((value, j) => j === 0 ? <th key={j} scope="row" className="text-left font-medium">{value}</th> : <td key={j}>{value}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </details>;
}

export const finite = (n: unknown, min: number, max: number): n is number => typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
export const recordOf = (value: unknown, allowed: readonly (string | boolean)[]): value is Record<string, never> =>
  !!value && typeof value === "object" && !Array.isArray(value) && Object.entries(value).every(([key, v]) => key !== "__proto__" && key !== "constructor" && allowed.includes(v as string | boolean));

/** Versioned links contain only the supplied scenario configuration, never browser files or keys. */
export function useScenarioLink<T extends object>({ id, state, activeId, restore, validate }: {
  id: string; state: T; activeId: string | null; restore: (state: T) => void; validate: (value: unknown) => value is T;
}) {
  const [message, setMessage] = useState("");
  const [fallback, setFallback] = useState("");
  const restored = useRef(false);
  const callbacks = useRef({ restore, validate });
  callbacks.current = { restore, validate };
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const raw = new URLSearchParams(window.location.search).get("scenario");
    if (!raw) return;
    try {
      if (raw.length > 30000) throw new Error("Too large");
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || parsed.tool !== id || !callbacks.current.validate(parsed.state)) throw new Error("Invalid state");
      callbacks.current.restore(parsed.state);
      setMessage("Shared scenario restored. Values below use these saved assumptions.");
    } catch { setMessage("This scenario link is invalid or from another version. The sample is still available."); }
  }, [id]);
  const share = async () => {
    const url = new URL(window.location.href);
    if (activeId) url.searchParams.set("uc", activeId); else url.searchParams.delete("uc");
    url.searchParams.set("scenario", JSON.stringify({ version: 1, tool: id, state }));
    // Next 14 copies router state for null and also updates its canonical URL.
    // Passing an existing __NA state bypasses that sync and breaks later Back navigation.
    window.history.replaceState(null, "", url);
    try { await navigator.clipboard.writeText(url.toString()); setMessage("Link copied with these assumptions and selections."); setFallback(""); }
    catch { setMessage("Copy the scenario link below."); setFallback(url.toString()); }
  };
  const clear = () => {
    const url = new URL(window.location.href); url.searchParams.delete("scenario");
    window.history.replaceState(null, "", url); setMessage("Sample assumptions restored."); setFallback("");
  };
  return { share, clear, message, fallback };
}

export function ScenarioActions({ share, reset, message, fallback }: {
  share: () => void; reset: () => void; message: string; fallback: string;
}) {
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">
      <button onClick={share} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink">Share these assumptions</button>
      <button onClick={reset} className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink">Reset this scenario</button>
    </div>
    {message && <p role="status" className="max-w-prose text-sm text-slatey-400">{message}</p>}
    {fallback && <input aria-label="Scenario link to copy" readOnly value={fallback} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 rounded border border-line p-2 text-xs" />}
  </div>;
}

export function validateScenario(value: unknown, fields: Record<string, (v: unknown) => boolean>): boolean {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.entries(fields).every(([key, valid]) => Object.prototype.hasOwnProperty.call(value, key) && valid((value as Record<string, unknown>)[key]));
}
export const oneOf = (values: readonly unknown[]) => (value: unknown) => values.includes(value);
export const bounded = (min: number, max: number) => (value: unknown) => finite(value, min, max);
export const bool = (value: unknown) => typeof value === "boolean";
export const shortString = (value: unknown) => typeof value === "string" && value.length < 150;

export function encodeScenario(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
}
export function decodeScenario(value: string): unknown {
  if (value.length > 250000) throw new Error("Scenario is too large");
  const text = atob(value);
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(text, (c) => c.charCodeAt(0)))); }
  catch { return JSON.parse(text); }
}
