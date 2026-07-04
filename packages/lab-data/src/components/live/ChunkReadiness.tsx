"use client";

import { useMemo, useState } from "react";
import { chunkText } from "@data/lib/prep/engine";
import { cn } from "@data/lib/cn";

const STRIPE = ["bg-primary/5", "bg-cyan-500/5", "bg-teal-500/5", "bg-violet-500/5"];

// Interactive chunk-readiness preview. Framed as "can this be cleanly segmented
// for embedding?" — NOT retrieval tuning (that lives in the RAG Evaluator).
export function ChunkReadiness({ serialized }: { serialized: string }) {
  const [tokens, setTokens] = useState(512);
  const [overlap, setOverlap] = useState(0);

  const preview = useMemo(() => chunkText(serialized, tokens, overlap), [serialized, tokens, overlap]);

  // paint chunk boundaries over a sample of the content
  const sample = serialized.slice(0, 1400);
  const chars = tokens * 4;
  const step = Math.max(1, chars - Math.round(chars * (overlap / 100)));
  const bands: string[] = [];
  for (let i = 0; i < sample.length; i += step) bands.push(sample.slice(i, i + chars));

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-center justify-between text-sm">
            <span className="font-medium text-slatey-200">Chunk size</span>
            <span className="font-mono text-xs text-slatey-300">{tokens} tokens</span>
          </span>
          <input
            type="range"
            min={128}
            max={1024}
            step={32}
            value={tokens}
            onChange={(e) => setTokens(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </label>
        <label className="block">
          <span className="flex items-center justify-between text-sm">
            <span className="font-medium text-slatey-200">Overlap</span>
            <span className="font-mono text-xs text-slatey-300">{overlap}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={25}
            step={5}
            value={overlap}
            onChange={(e) => setOverlap(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Chunks", preview.count.toLocaleString(), "at this setting"],
          ["Avg tokens/chunk", preview.avgTokens.toLocaleString(), "target 350–512"],
          ["Oversized blocks", String(preview.oversized), preview.oversized ? "would split mid-thought" : "none"],
        ].map(([l, v, s]) => (
          <div key={l} className="rounded-lg border border-line bg-slate-50 p-3">
            <div className="stat-label">{l}</div>
            <div className="mt-1 text-xl font-semibold tracking-tight text-ink">{v}</div>
            <div className="mt-0.5 font-mono text-[11px] text-slatey-400">{s}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="stat-label mb-1.5">Boundary preview</div>
        <div className="max-h-44 overflow-y-auto rounded-lg border border-line bg-white p-1 font-mono text-[11px] leading-relaxed text-slatey-200">
          {bands.map((b, i) => (
            <span key={i} className={cn(STRIPE[i % STRIPE.length], "block whitespace-pre-wrap rounded px-2 py-1")}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
