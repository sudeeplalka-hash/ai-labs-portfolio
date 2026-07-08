"use client";

import { useMemo, useState } from "react";
import { FlaskConical, Play, Check, X } from "lucide-react";
import { runProof, PROOF_QUESTIONS, type ProofResult } from "@data/lib/prep/proof";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { Badge } from "@data/components/common/Badge";
import { cn } from "@data/lib/cn";

// Cleaning-to-quality proof (Phase 5). Runs the deterministic baseline
// retriever over this corpus twice, raw vs cleaned, against an authored
// golden set, and reports the measured difference. LIVE: computed in your
// browser on this corpus, every run, no cached numbers.

export function CleaningProof({
  files,
  excludedNames,
  topicsByFile,
  hasResolutions,
  previewExclusions,
  onResult,
}: {
  files: { name: string; text: string }[];
  excludedNames: Set<string>;
  topicsByFile: Map<string, string[]>;
  hasResolutions: boolean;
  /** Recommended exclusions, used for the one-click preview when nothing is resolved yet. */
  previewExclusions: Set<string>;
  /** Surfaces the latest run so the readiness dossier can cite it. */
  onResult?: (r: ProofResult, preview: boolean) => void;
}) {
  const [result, setResult] = useState<ProofResult | null>(null);
  const [usedPreview, setUsedPreview] = useState(false);

  const canRun = useMemo(() => {
    const names = new Set(files.map((f) => f.name));
    return PROOF_QUESTIONS.every((q) => names.has(q.expectedFile));
  }, [files]);

  if (!canRun) {
    return (
      <Panel>
        <SectionHeader title="Cleaning-to-quality proof" description="Measured on the sample corpus" icon={FlaskConical} />
        <p className="rounded-lg border border-dashed border-line bg-slate-50/60 p-3 text-xs leading-relaxed text-slatey-400">
          The golden questions are authored against the sample corpus, so the measured before/after runs there. Your
          uploaded corpus still gets the full pipeline (board, resolution, atlas, handoff); load the sample corpus to
          see the retrieval-quality delta demonstrated end to end.
        </p>
      </Panel>
    );
  }

  const run = (preview: boolean) => {
    const exclusions = preview ? previewExclusions : excludedNames;
    const r = runProof(files, exclusions, topicsByFile);
    setResult(r);
    setUsedPreview(preview);
    onResult?.(r, preview);
  };

  const delta = result ? result.cleaned.accuracyPct - result.raw.accuracyPct : 0;

  return (
    <Panel>
      <div className="flex items-start justify-between gap-2">
        <SectionHeader
          title="Cleaning-to-quality proof"
          description="Same retriever, run twice: raw corpus vs your cleaned corpus, measured live"
          icon={FlaskConical}
        />
        <Badge color="emerald">LIVE</Badge>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => run(false)}
          disabled={!hasResolutions && excludedNames.size === 0 && topicsByFile.size === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play className="h-3.5 w-3.5" /> Run with my resolutions
        </button>
        <button
          onClick={() => run(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-slatey-300 hover:text-ink"
        >
          <Play className="h-3.5 w-3.5" /> Preview with recommended resolutions
        </button>
        {!hasResolutions && excludedNames.size === 0 && (
          <span className="text-[11px] text-slatey-500">Accept resolutions above (or preview) to see the delta.</span>
        )}
      </div>

      {result && (
        <>
          {usedPreview && (
            <p className="mb-2 text-[11px] font-medium text-amber-700">
              Preview run: recommended resolutions applied for this measurement only, nothing in your session changed.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-white p-2.5 text-center">
              <p className="stat-label">Raw corpus</p>
              <p className="font-mono text-lg font-semibold text-ink">{result.raw.accuracyPct}%</p>
              <p className="text-[11px] text-slatey-500">{result.raw.correct}/{result.raw.total} answered from the right file · stale evidence in {result.raw.staleSharePct}%</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-2.5 text-center">
              <p className="stat-label">Cleaned corpus</p>
              <p className="font-mono text-lg font-semibold text-ink">{result.cleaned.accuracyPct}%</p>
              <p className="text-[11px] text-slatey-500">{result.cleaned.correct}/{result.cleaned.total} correct · stale evidence in {result.cleaned.staleSharePct}%</p>
            </div>
            <div className={cn("rounded-lg border p-2.5 text-center", delta > 0 ? "border-emerald-200 bg-emerald-50/60" : "border-line bg-white")}>
              <p className="stat-label">Measured effect</p>
              <p className={cn("font-mono text-lg font-semibold", delta > 0 ? "text-emerald-700" : "text-ink")}>
                {delta > 0 ? `+${delta}` : delta} pts
              </p>
              <p className="text-[11px] text-slatey-500">
                stale evidence {result.raw.staleSharePct}% \u2192 {result.cleaned.staleSharePct}%
              </p>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-wide text-slatey-500">
                  <th className="pb-1 pr-2">Golden question</th>
                  <th className="pb-1 pr-2">Raw top source</th>
                  <th className="pb-1 pr-2">Cleaned top source</th>
                  <th className="pb-1"> </th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.id} className="border-t border-line/70 align-top">
                    <td className="max-w-[220px] py-1.5 pr-2 text-slatey-300">{r.question}</td>
                    <td className={cn("py-1.5 pr-2 font-mono text-[11px]", r.rawStaleEvidence ? "text-amber-700" : "text-slatey-400")}>
                      {r.rawTopFile}{r.rawStaleEvidence ? " \u26a0" : ""}
                    </td>
                    <td className="py-1.5 pr-2 font-mono text-[11px] text-slatey-400">{r.cleanedTopFile}</td>
                    <td className="py-1.5">
                      {r.cleanedCorrect ? <Check className="h-3.5 w-3.5 text-status-healthy" aria-label="cleaned run correct" /> : <X className="h-3.5 w-3.5 text-status-risk" aria-label="cleaned run incorrect" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-slatey-500">
            How this is measured: Okapi BM25 (k1 1.5, b 0.75) over ~120-token chunks, the same algorithm family as
            Build&apos;s baseline retrieval mode; correct = the top-ranked chunk comes from the file that actually
            answers the question; \u26a0 = superseded-version evidence in the top 3. Confirmed topic tags apply a
            disclosed \u00d71.15 score bonus when a question matches a tag. Deterministic: same corpus, same numbers.
          </p>
        </>
      )}
    </Panel>
  );
}
