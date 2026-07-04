"use client";

import { ArrowRight } from "lucide-react";
import type { PrepReport } from "@data/lib/prep/types";
import { cn } from "@data/lib/cn";

interface DiffRow {
  label: string;
  before: string;
  after: string;
  improved: boolean;
}

function buildRows(report: PrepReport, applied: Set<string>): DiffRow[] {
  const piiTotal = report.pii.reduce((a, b) => a + b.count, 0);
  const piiAfter = applied.has("pii") ? 0 : piiTotal;
  const rows: DiffRow[] = [];
  if (report.profile.kind === "tabular") {
    const p = report.profile;
    const deadCols = p.columns.filter((c) => c.distinct <= 1).length;
    const rowsAfter = p.rows - (applied.has("emptyrows") ? p.emptyRows : 0) - (applied.has("dups") ? p.dups : 0);
    const colsAfter = p.cols - (applied.has("deadcols") ? deadCols : 0);
    rows.push({ label: "Rows", before: p.rows.toLocaleString(), after: rowsAfter.toLocaleString(), improved: rowsAfter !== p.rows });
    rows.push({ label: "Columns", before: String(p.cols), after: String(colsAfter), improved: colsAfter !== p.cols });
    rows.push({
      label: "Duplicate rows",
      before: String(p.dups),
      after: applied.has("dups") ? "0" : String(p.dups),
      improved: p.dups > 0 && applied.has("dups"),
    });
  } else {
    const p = report.profile;
    rows.push({ label: "Words", before: p.words.toLocaleString(), after: p.words.toLocaleString(), improved: false });
    rows.push({
      label: "Repeated lines",
      before: String(p.repeatedLines),
      after: applied.has("boilerplate") ? "0" : String(p.repeatedLines),
      improved: p.repeatedLines > 0 && applied.has("boilerplate"),
    });
  }
  rows.push({ label: "PII hits", before: String(piiTotal), after: String(piiAfter), improved: piiTotal > 0 && piiAfter === 0 });
  return rows;
}

export function BeforeAfterDiff({ report, applied }: { report: PrepReport; applied: Set<string> }) {
  const rows = buildRows(report, applied);
  const anyChange = rows.some((r) => r.improved);
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slatey-400">
          <span>Raw (as uploaded)</span>
          <span />
          <span className="text-right">Prepared</span>
        </div>
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-3 py-2 last:border-b-0">
            <div className="text-sm">
              <span className="text-slatey-400">{r.label}: </span>
              <span className="font-mono font-medium text-slatey-100">{r.before}</span>
            </div>
            <ArrowRight className={cn("h-3.5 w-3.5", r.improved ? "text-emerald-500" : "text-slatey-400")} />
            <div className="text-right text-sm">
              <span className={cn("font-mono font-semibold", r.improved ? "text-emerald-600" : "text-slatey-200")}>{r.after}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-slatey-400">
        {anyChange ? "Apply more fixes above to see the prepared column improve further." : "Apply fixes above (dedup, drop empty rows, redact PII) to see the prepared result change."}
      </p>
    </div>
  );
}
