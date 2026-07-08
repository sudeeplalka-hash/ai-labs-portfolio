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

  const rows = useMemo(
    () => (showClosed ? findings : findings.filter((f) => f.status === "open")),
    [findings, showClosed],
  );

  // Grouped view (UX rework): one card per finding TYPE with its downstream
  // consequence stated once, and a compact per-file action row inside, so six
  // identical "tag metadata" cards collapse into one group of six rows.
  const groups = useMemo(() => {
    const byKey = new Map<string, { key: string; name: string; guideline: CorpusFinding["guideline"]; downstream: string; worst: Exclude<CorpusFinding["level"], never>; items: CorpusFinding[] }>();
    for (const f of rows) {
      const key = `${f.guideline}:${f.checkId}`;
      const g = byKey.get(key) ?? { key, name: f.name, guideline: f.guideline, downstream: f.downstream, worst: f.level, items: [] };
      g.items.push(f);
      if (SEV_RANK[f.level] < SEV_RANK[g.worst]) g.worst = f.level;
      byKey.set(key, g);
    }
    const list = [...byKey.values()];
    for (const g of list) g.items.sort((a, b) => SEV_RANK[a.level] - SEV_RANK[b.level] || a.fileName.localeCompare(b.fileName));
    return list.sort((a, b) => {
      if (sort === "severity") return SEV_RANK[a.worst] - SEV_RANK[b.worst] || b.items.length - a.items.length;
      if (sort === "category") return a.guideline.localeCompare(b.guideline) || SEV_RANK[a.worst] - SEV_RANK[b.worst];
      return b.items.length - a.items.length || SEV_RANK[a.worst] - SEV_RANK[b.worst];
    });
  }, [rows, sort]);

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
            <option value="file">Sort: affected files</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-slate-50/60 p-3 text-center text-xs text-slatey-400">
          No findings — this corpus is clean under the current profile.
        </p>
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.key} className="rounded-lg border border-line bg-white">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-line/70 px-2.5 py-2">
                <Badge color={SEV_COLOR[g.worst]}>{g.worst}</Badge>
                <span className="text-[13px] font-semibold text-ink">{g.name}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slatey-500">{RULEBOOK[g.guideline].name}</span>
                <span className="ml-auto text-[11px] text-slatey-500">{g.items.filter((x) => x.status === "open").length} open · {g.items.length} file{g.items.length === 1 ? "" : "s"}</span>
                {g.items.filter((x) => x.status === "open").length > 1 && (
                  <span className="flex items-center gap-1.5">
                    {g.items.some((x) => x.status === "open" && x.fixId) && (
                      <button
                        onClick={() => g.items.forEach((x) => x.status === "open" && x.fixId && onSetStatus(x.key, "fixed"))}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-white hover:bg-primary-dark"
                      >
                        <Wrench className="h-3 w-3" /> Fix all
                      </button>
                    )}
                    <button
                      onClick={() => g.items.forEach((x) => x.status === "open" && onSetStatus(x.key, "accepted-risk"))}
                      className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-slatey-300 hover:text-ink"
                    >
                      <ShieldQuestion className="h-3 w-3" /> Accept all
                    </button>
                  </span>
                )}
              </div>
              <p className="px-2.5 pt-1.5 text-[11px] leading-snug text-slatey-500">Downstream: {g.downstream}</p>
              <ul className="divide-y divide-line/60 px-2.5 pb-1.5 pt-1">
                {g.items.map((f) => (
                  <li key={f.key} className={cn("flex flex-wrap items-center gap-2 py-1.5", f.status !== "open" && "opacity-60")}>
                    <span className="min-w-0 flex-1">
                      <span className="mr-2 truncate font-mono text-[11px] text-slatey-300">{f.fileName}</span>
                      <span className="text-xs text-slatey-400">{f.detail}</span>
                    </span>
                    {f.status === "fixed" && <Badge color="emerald">fixed{typeof f.fixDelta === "number" ? ` +${f.fixDelta}` : ""}</Badge>}
                    {f.status === "accepted-risk" && <Badge color="amber">accepted</Badge>}
                    <span className="flex shrink-0 items-center gap-1.5">
                      {f.status === "open" ? (
                        <>
                          {f.fixId && (
                            <button
                              onClick={() => onSetStatus(f.key, "fixed")}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-white hover:bg-primary-dark"
                            >
                              <Wrench className="h-3 w-3" /> {f.fixLabel ?? "Fix"}{typeof f.fixDelta === "number" ? ` (+${f.fixDelta})` : ""}
                            </button>
                          )}
                          <button
                            onClick={() => onSetStatus(f.key, "accepted-risk")}
                            className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-slatey-300 hover:text-ink"
                          >
                            <ShieldQuestion className="h-3 w-3" /> Accept
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
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
