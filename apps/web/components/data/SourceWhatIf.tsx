"use client";

// Phase E, "Block this source" what-if. The best possible proof that the
// contracts are real: pick a source, and watch the exclusion ripple through
// retrieval (rerank drops its evidence), governance (findings + decision), and
// release blockers, all computed by the same engines the stages use.
// Strictly read-only: the simulation never writes to program state.

import { useMemo, useState } from "react";
import Link from "next/link";
import { FlaskConical, ArrowRight, Ban } from "lucide-react";
import {
  useProgramSource, buildDataReadinessHandoff, deriveGovernanceDecision,
  deriveOpenFindings, selectReleaseBlockers, type ProgramState,
} from "@labs/program-core";
import { Panel, SectionHeader, Badge, cn } from "@labs/design-system";
import { SAMPLE_CHUNKS, runRetrieval } from "@rag/lib/live-lab/retrievalModes";

export function SourceWhatIf() {
  const { src, hydrated } = useProgramSource();

  const handoff = src.data?.handoff ?? (src.initiative?.name ? buildDataReadinessHandoff(src) : undefined);
  const currentBlocked = useMemo(() => handoff?.blockedSources ?? [], [handoff]);

  // The retrieval corpus is the honest universe for this experiment, these are
  // the sources whose exclusion visibly changes what the answer engine sees.
  const corpusSources = useMemo(() => Array.from(new Set(SAMPLE_CHUNKS.map((c) => c.source))), []);
  const candidates = corpusSources.filter((s) => !currentBlocked.includes(s));

  const [simSource, setSimSource] = useState<string | null>(null);

  const sim = useMemo(() => {
    if (!simSource || !handoff) return null;
    const simBlocked = [...currentBlocked, simSource];

    // Simulated state: same program, one more blocked source. Never persisted.
    const simState: ProgramState = JSON.parse(JSON.stringify(src));
    simState.data = { ...(simState.data ?? {}), handoff: { ...handoff, blockedSources: simBlocked } };

    const beforeRet = runRetrieval("hybrid rerank", currentBlocked);
    const afterRet = runRetrieval("hybrid rerank", simBlocked);
    const beforeTop = beforeRet.results.find((r) => !r.excluded)?.source ?? "N/A";
    const afterTop = afterRet.results.find((r) => !r.excluded)?.source ?? "N/A";
    const droppedEvidence = afterRet.results.filter((r) => r.excluded && r.source === simSource).length;

    return {
      simBlocked,
      decisionBefore: deriveGovernanceDecision(src).decision ?? "N/A",
      decisionAfter: deriveGovernanceDecision(simState).decision ?? "N/A",
      findingsBefore: deriveOpenFindings(src).length,
      findingsAfter: deriveOpenFindings(simState).length,
      blockersBefore: selectReleaseBlockers(src).length,
      blockersAfter: selectReleaseBlockers(simState).length,
      beforeTop,
      afterTop,
      droppedEvidence,
    };
  }, [simSource, handoff, currentBlocked, src]);

  if (!hydrated || !handoff) return null;

  return (
    <Panel>
      <SectionHeader eyebrow="What-if experiment" title="Block a source, feel the wiring" icon={FlaskConical}
        description="Pick a source from the retrieval corpus and watch the exclusion ripple downstream: rerank drops its evidence, governance opens a finding, and the decision can flip. Nothing is saved, it's a pure simulation over the same engines."
        action={simSource ? <button onClick={() => setSimSource(null)} className="text-xs font-semibold text-primary">clear</button> : null} />

      <div className="flex flex-wrap gap-2">
        {currentBlocked.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50/60 px-2.5 py-1.5 text-xs font-medium text-rose-700">
            <Ban className="h-3 w-3" /> {s} · already blocked
          </span>
        ))}
        {candidates.map((s) => (
          <button key={s} onClick={() => setSimSource(simSource === s ? null : s)} aria-pressed={simSource === s}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
              simSource === s ? "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-300" : "border-line bg-white text-slatey-300 hover:border-slatey-500 hover:text-ink",
            )}>
            {simSource === s ? "Blocking: " : ""}{s}
          </button>
        ))}
      </div>

      {sim && simSource && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/30 p-4">
          <p className="text-sm font-semibold text-ink">If <span className="text-rose-700">{simSource}</span> were blocked:</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Delta label="Retrieval evidence" before={`${sim.droppedEvidence ? sim.droppedEvidence : "0"} item(s)`} after="excluded from rerank"
              changed={sim.droppedEvidence > 0} plain={sim.droppedEvidence === 0 ? "This source contributes no evidence to the sample query." : undefined} />
            <Delta label="Top evidence" before={sim.beforeTop} after={sim.afterTop} changed={sim.beforeTop !== sim.afterTop} />
            <Delta label="Open findings" before={`${sim.findingsBefore}`} after={`${sim.findingsAfter}`} changed={sim.findingsAfter !== sim.findingsBefore} />
            <Delta label="Governance decision" before={sim.decisionBefore} after={sim.decisionAfter} changed={sim.decisionBefore !== sim.decisionAfter} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-slatey-400">
            <span>
              Release blockers {sim.blockersBefore} → <b className={sim.blockersAfter > sim.blockersBefore ? "text-rose-700" : "text-ink"}>{sim.blockersAfter}</b>
              {" · "}see the exclusion applied in{" "}
              <Link href="/build/retrieval" className="font-semibold text-primary hover:text-primary-dark">Retrieval <ArrowRight className="inline h-3 w-3" /></Link>
              {" "}and the finding in{" "}
              <Link href="/govern" className="font-semibold text-primary hover:text-primary-dark">Govern <ArrowRight className="inline h-3 w-3" /></Link>
            </span>
            <Badge tone="slate">simulation only, nothing saved</Badge>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Delta({ label, before, after, changed, plain }: { label: string; before: string; after: string; changed: boolean; plain?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-2.5">
      <p className="stat-label">{label}</p>
      {plain ? (
        <p className="mt-0.5 text-[12px] leading-snug text-slatey-400">{plain}</p>
      ) : (
        <p className="mt-0.5 text-[12px] leading-snug">
          <span className="text-slatey-400">{before}</span>
          <span className="mx-1 text-slatey-500">→</span>
          <span className={changed ? "font-semibold text-rose-700" : "font-semibold text-ink"}>{after}</span>
        </p>
      )}
    </div>
  );
}
