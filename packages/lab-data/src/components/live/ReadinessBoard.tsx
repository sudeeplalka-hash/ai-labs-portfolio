"use client";

import { LayoutGrid } from "lucide-react";
import type { CorpusFile } from "@data/lib/prep/corpus";
import type { CategoryRollup, CorpusFinding } from "@data/lib/prep/findings";
import { FINDING_WEIGHT } from "@data/lib/prep/findings";
import type { GuidelineId, Level } from "@data/lib/prep/types";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { cn } from "@data/lib/cn";

// Corpus Readiness Board (Phase 1): every rulebook category as a corpus-level
// score with its plain-language rule, plus the per-file × category matrix.
// A cell's score is the same visible math the rollup uses (100 − severity
// weights for that file's open findings in that category, floor 0).

const LEVEL_TONE: Record<Level, string> = {
  healthy: "bg-status-healthy/15 text-status-healthy",
  watch: "bg-status-watch/15 text-status-watch",
  risk: "bg-status-risk/15 text-status-risk",
  critical: "bg-status-critical/15 text-status-critical",
};

const SHORT: Partial<Record<GuidelineId, string>> = {
  admissibility: "Admiss.",
  format: "Format",
  dedup: "Dedup",
  freshness: "Freshness",
  privacy: "Privacy",
  provenance: "Provenance",
  taxonomy: "Taxonomy",
  chunk: "Chunk",
  concentration: "Concentr.",
  cohesion: "Cohesion",
};

const cellTone = (score: number, hasOpen: boolean): string => {
  if (!hasOpen && score === 100) return "bg-status-healthy/10 text-status-healthy";
  if (score >= 85) return "bg-status-healthy/15 text-status-healthy";
  if (score >= 65) return "bg-status-watch/20 text-status-watch";
  if (score >= 40) return "bg-status-risk/20 text-status-risk";
  return "bg-status-critical/20 text-status-critical";
};

export function fileCategoryScore(
  findings: CorpusFinding[],
  fileId: string,
  guideline: GuidelineId,
): { score: number; open: number } {
  let penalty = 0;
  let open = 0;
  for (const f of findings) {
    if (f.fileId !== fileId || f.guideline !== guideline || f.status === "fixed") continue;
    penalty += FINDING_WEIGHT[f.level];
    if (f.status === "open") open++;
  }
  return { score: Math.max(0, 100 - penalty), open };
}

export function ReadinessBoard({
  files,
  findings,
  rollups,
  selectedId,
  onSelectFile,
}: {
  files: CorpusFile[];
  findings: CorpusFinding[];
  rollups: CategoryRollup[];
  selectedId: string | null;
  onSelectFile: (id: string) => void;
}) {
  return (
    <Panel>
      <SectionHeader
        title="Corpus readiness board"
        description="Every guideline scored across the corpus, computed live, same math as the file gates"
        icon={LayoutGrid}
      />

      {/* Category rollups */}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {rollups.map((r) => (
          <div key={r.guideline} className="flex flex-col rounded-lg border border-line bg-white p-2.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slatey-400">{r.name}</span>
              <span className={cn("rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold", LEVEL_TONE[r.level])}>{r.score}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full",
                  r.score >= 85 ? "bg-status-healthy" : r.score >= 65 ? "bg-status-watch" : r.score >= 40 ? "bg-status-risk" : "bg-status-critical",
                )}
                style={{ width: `${r.score}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-slatey-400">{r.definition}</p>
            {r.findingCount > 0 && (
              <p className="mt-auto pt-1.5 text-[11px] font-medium text-slatey-300">
                {r.findingCount} open · {r.filesAffected} file{r.filesAffected === 1 ? "" : "s"}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Per-file × category matrix */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white pb-1.5 pr-3 text-[11px] font-semibold uppercase tracking-wide text-slatey-400">File</th>
              {rollups.map((r) => (
                <th key={r.guideline} className="px-1 pb-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slatey-500" title={`${r.name}: ${r.definition}`}>
                  {SHORT[r.guideline] ?? r.name.split(" ")[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id}>
                <td title={f.name} className="sticky left-0 max-w-[220px] truncate bg-white py-0.5 pr-3 font-mono text-[11px] text-slatey-300">{f.name}</td>
                {rollups.map((r) => {
                  const cell = fileCategoryScore(findings, f.id, r.guideline);
                  return (
                    <td key={r.guideline} className="p-0.5">
                      <button
                        onClick={() => onSelectFile(f.id)}
                        aria-label={`${f.name}: ${r.name} ${cell.score}/100${cell.open ? `, ${cell.open} open finding${cell.open === 1 ? "" : "s"}` : ""}`}
                        className={cn(
                          "block w-full rounded px-1 py-1 text-center font-mono text-[11px] font-semibold transition-colors hover:ring-1 hover:ring-primary/40",
                          cellTone(cell.score, cell.open > 0),
                          selectedId === f.id && "ring-1 ring-primary/60",
                        )}
                      >
                        {cell.score}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slatey-500">
        Cell math: 100 − (watch −{FINDING_WEIGHT.watch} · risk −{FINDING_WEIGHT.risk} · critical −{FINDING_WEIGHT.critical}) per open finding in that
        category, floor 0. Fixing a finding in the backlog restores the cell and the file gate together.
      </p>
    </Panel>
  );
}
