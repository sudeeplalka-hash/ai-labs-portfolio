"use client";

import { useMemo, useState } from "react";
import { ListChecks, Wrench, ShieldQuestion, Undo2 } from "lucide-react";
import type { CorpusFinding, FindingStatus } from "@data/lib/prep/findings";
import { RULEBOOK } from "@data/lib/prep/rulebook";
import type { Level } from "@data/lib/prep/types";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { Badge, type BadgeColor } from "@data/components/common/Badge";
import { cn } from "@data/lib/cn";

// Remediation Backlog (Phase 1): the handoff's remediationBacklog field,
// materialized as a working ledger. Fix and accept-risk act on the SAME
// engine scoring the file view uses, so the Board and gates move live.

const SEV_COLOR: Record<Exclude<Level, "healthy">, BadgeColor> = {
  watch: "amber",
  risk: "orange",
  critical: "rose",
};
const SEV_RANK: Record<Exclude<Level, "healthy">, number> = { critical: 0, risk: 1, watch: 2 };

type SortKey = "severity" | "category" | "file";

export function RemediationBacklog({
  findings,
  onSetStatus,
}: {
  findings: CorpusFinding[];
  onSetStatus: (key: string, status: FindingStatus) => void;
}) {
  const [sort, setSort] = useState<SortKey>("severity");
  const [showClosed, setShowClosed] = useState(true);

  const rows = useMemo(() => {
    const base = showClosed ? findings : findings.filter((f) => f.status === "open");
    return base.slice().sort((a, b) => {
      if (sort === "severity") return SEV_RANK[a.level] - SEV_RANK[b.level] || a.fileName.localeCompare(b.fileName);
      if (sort === "category") return a.guideline.localeCompare(b.guideline) || SEV_RANK[a.level] - SEV_RANK[b.level];
      return a.fileName.localeCompare(b.fileName) || SEV_RANK[a.level] - SEV_RANK[b.level];
    });
  }, [findings, sort, showClosed]);

  const open = findings.filter((f) => f.status === "open").length;
  const fixed = findings.filter((f) => f.status === "fixed").length;
  const accepted = findings.filter((f) => f.status === "accepted-risk").length;

  return (
    <Panel>
      <SectionHeader
        title="Remediation backlog"
        description="Every open finding across the corpus, fix it or accept the risk, the scores follow"
        icon={ListChecks}
      />

      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slatey-400">
          <Badge color="slate">{open} open</Badge>
          <Badge color="emerald">{fixed} fixed</Badge>
          <Badge color="amber">{accepted} accepted risk</Badge>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] text-slatey-400">
            <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} className="accent-primary" />
            show resolved
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort backlog"
            className="rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-medium text-slatey-300"
          >
            <option value="severity">Sort: severity</option>
            <option value="category">Sort: category</option>
            <option value="file">Sort: file</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-slate-50/60 p-3 text-center text-xs text-slatey-400">
          No findings — this corpus is clean under the current profile.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((f) => (
            <li
              key={f.key}
              className={cn(
                "rounded-lg border border-line bg-white p-2.5",
                f.status !== "open" && "opacity-70",
              )}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge color={SEV_COLOR[f.level]}>{f.level}</Badge>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">{RULEBOOK[f.guideline].name}</span>
                <span className="truncate font-mono text-[11px] text-slatey-400">{f.fileName}</span>
                {f.status === "fixed" && <Badge color="emerald">fixed{typeof f.fixDelta === "number" ? ` · +${f.fixDelta}` : ""}</Badge>}
                {f.status === "accepted-risk" && <Badge color="amber">accepted risk</Badge>}
              </div>
              <p className="mt-1 text-[13px] font-medium text-ink">{f.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slatey-400">{f.detail}</p>
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slatey-500">Downstream: {f.downstream}</p>
                <div className="flex items-center gap-1.5">
                  {f.status === "open" ? (
                    <>
                      {f.fixId && (
                        <button
                          onClick={() => onSetStatus(f.key, "fixed")}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-white hover:bg-primary-dark"
                        >
                          <Wrench className="h-3 w-3" /> {f.fixLabel ?? "Apply fix"}
                          {typeof f.fixDelta === "number" ? ` (+${f.fixDelta})` : ""}
                        </button>
                      )}
                      <button
                        onClick={() => onSetStatus(f.key, "accepted-risk")}
                        className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-slatey-300 hover:text-ink"
                      >
                        <ShieldQuestion className="h-3 w-3" /> Accept risk
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onSetStatus(f.key, "open")}
                      className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-slatey-300 hover:text-ink"
                    >
                      <Undo2 className="h-3 w-3" /> Reopen
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
