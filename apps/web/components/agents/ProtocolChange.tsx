"use client";

import { useLayoutEffect, useRef } from "react";
import { useReducedMotion, useInViewport } from "@labs/design-system";
import { ChangeReceipt, EvidenceTable, signed } from "./AgentExperience";

export function ProtocolChange({ rows, changes, onPin, baselineWinner, currentWinner }: {
  rows: { key: string; label: string; color: string; score: number; baseline: number }[];
  changes: string[]; onPin: () => void; baselineWinner: string; currentWinner: string;
}) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const visible = useInViewport(root, "0px");
  const positions = useRef(new Map<string, number>());
  const ranked = [...rows].sort((a, b) => b.score - a.score);
  const order = ranked.map((row) => row.key).join("|");
  useLayoutEffect(() => {
    const nodes = root.current?.querySelectorAll<HTMLElement>("[data-protocol]");
    const animations: Animation[] = [];
    nodes?.forEach((node) => {
      const key = node.dataset.protocol!;
      const top = node.offsetTop;
      const previous = positions.current.get(key);
      if (!reduced && visible && previous !== undefined && previous !== top && !document.hidden) {
        animations.push(node.animate([{ transform: `translateY(${previous - top}px)` }, { transform: "translateY(0)" }], { duration: 320, easing: "cubic-bezier(.2,0,.2,1)" }));
      }
      positions.current.set(key, top);
    });
    const stop = () => animations.forEach((animation) => animation.cancel());
    window.addEventListener("resize", stop);
    document.addEventListener("visibilitychange", stop);
    return () => { stop(); window.removeEventListener("resize", stop); document.removeEventListener("visibilitychange", stop); };
  }, [order, reduced, visible]);
  return <ChangeReceipt title="What changed the recommendation?" onPin={onPin}>
    <p>{changes.length ? `${changes.length} input${changes.length === 1 ? "" : "s"} changed from the pinned baseline. ` : "Baseline and current inputs match. "}
      {baselineWinner === currentWinner ? `${currentWinner} remains first.` : `${baselineWinner} → ${currentWinner}.`}</p>
    {changes.length > 0 && <ul className="my-2 list-disc pl-5">{changes.map((change) => <li key={change}>{change}</li>)}</ul>}
    <div ref={root} className="relative mt-3 grid gap-2" aria-label="Protocols in current rank order">
      {ranked.map((row, i) => <div key={row.key} data-protocol={row.key} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white p-3">
        <span className="font-mono text-sm text-slatey-400">{i + 1}</span><span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: row.color }} />
        <span className="mr-auto font-semibold text-ink">{row.label}</span><span className="font-mono">{row.score.toFixed(1)} points</span>
        <span className="text-xs text-slatey-400">{signed(row.score - row.baseline, 1)} from baseline</span>
      </div>)}
    </div>
    <details className="mt-3"><summary className="cursor-pointer font-medium text-ink">Compare all scores with the baseline</summary>
      <EvidenceTable caption="Protocol score changes" headers={["Protocol", "Baseline", "Current", "Change"]} rows={rows.map((row) => [row.label, row.baseline.toFixed(1), row.score.toFixed(1), signed(row.score - row.baseline, 1)])} />
    </details>
    <p className="mt-2 text-xs">Only real rank changes move the rows. Scores are model points, not probabilities or measured protocol performance.</p>
  </ChangeReceipt>;
}
