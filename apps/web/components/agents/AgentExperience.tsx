"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { copyToClipboard, usePlayback } from "@labs/design-system";

const control = "inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-primary focus-visible:outline-primary disabled:opacity-50";

/** Shared transport controls for authored explanations; playback is never model progress. */
export function ExplanationControls({ playback, count, label = "Explanation" }: {
  playback: ReturnType<typeof usePlayback>; count: number; label?: string;
}) {
  return <section aria-label={`${label} controls`} className="my-4 rounded-xl border border-line bg-white p-4">
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={control} onClick={playback.playing ? playback.pause : playback.play}>
        {playback.reducedMotion ? "Show complete explanation" : playback.playing ? "Pause" : playback.index >= count ? "Replay" : "Play explanation"}
      </button>
      <button type="button" className={control} onClick={() => { playback.pause(); playback.setIndex(Math.max(0, playback.index - 1)); }} disabled={playback.index === 0}>Previous</button>
      <button type="button" className={control} onClick={playback.next} disabled={playback.index >= count}>Step</button>
      <button type="button" className={control} onClick={playback.complete}>Show all</button>
      <button type="button" className={control} onClick={playback.reset}>Reset</button>
      <label className="flex min-h-11 items-center gap-2 text-sm text-slatey-400">Speed
        <select className="rounded-md border border-line bg-white p-2 text-ink" value={playback.speed} onChange={(event) => playback.setSpeed(Number(event.target.value))} disabled={playback.reducedMotion}>
          <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option>
        </select>
      </label>
      <span className="text-sm text-slatey-400">{playback.reducedMotion ? "Static view" : playback.playing ? "Playing explanation" : "Paused"} · {playback.index}/{count} steps</span>
    </div>
    <label className="mt-3 block text-sm text-slatey-400">Choose a step
      <input className="mt-2 block w-full accent-primary" type="range" min={0} max={count} step={1} value={playback.index} onChange={(event) => { playback.pause(); playback.setIndex(Number(event.target.value)); }} aria-valuetext={`${playback.index} of ${count} steps revealed`} />
    </label>
  </section>;
}

export function EvidenceTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: ReactNode[][] }) {
  return <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-line" role="region" aria-label={caption} tabIndex={0}>
    <table className="w-full text-left text-sm">
      <caption className="p-3 text-left font-semibold text-ink">{caption}</caption>
      <thead className="bg-slate-50"><tr>{headers.map((header) => <th key={header} scope="col" className="px-3 py-2 font-medium text-slatey-300">{header}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i} className="border-t border-line">{row.map((cell, j) => j === 0 ? <th key={j} scope="row" className="px-3 py-2 font-medium text-ink">{cell}</th> : <td key={j} className="px-3 py-2 text-slatey-300">{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

export function CodeEvidence({ title, value }: { title: string; value: unknown }) {
  const [wrap, setWrap] = useState(true);
  const [feedback, setFeedback] = useState("");
  const id = useId();
  const content = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  useEffect(() => setFeedback(""), [content]);
  return <section className="min-w-0 rounded-lg border border-line bg-white p-3" aria-labelledby={id}>
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <h3 id={id} className="mr-auto text-sm font-semibold text-ink">{title}</h3>
      <button type="button" className={control} aria-pressed={wrap} onClick={() => setWrap((current) => !current)}>Wrap code</button>
      <button type="button" className={control} onClick={async () => setFeedback(await copyToClipboard(content) ? "Copied." : "Copy unavailable. Select the code below and copy it manually.")}>Copy</button>
    </div>
    <pre tabIndex={0} aria-label={title} className={`max-h-96 overflow-auto rounded-lg bg-ink p-3 text-xs leading-relaxed text-white ${wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"}`}>{content}</pre>
    <p className="mt-2 text-xs text-slatey-400" role="status">{feedback}</p>
  </section>;
}

export function ChangeReceipt({ title, children, onPin, pinLabel = "Use current as baseline" }: { title: string; children: ReactNode; onPin?: () => void; pinLabel?: string }) {
  return <section className="my-4 rounded-xl border border-primary/25 bg-primary/5 p-4" aria-label={title}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold text-ink">{title}</h2>{onPin && <button type="button" className={control} onClick={onPin}>{pinLabel}</button>}</div>
    <div className="mt-2 text-sm leading-relaxed text-slatey-300">{children}</div>
  </section>;
}

export function signed(value: number, digits = 0) { return `${value > 0 ? "+" : ""}${value.toFixed(digits)}`; }
