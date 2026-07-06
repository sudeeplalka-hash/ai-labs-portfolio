"use client";

import { useState } from "react";
import { MessageSquareText, AlertTriangle, ShieldAlert, CircleCheck, ArrowRight } from "lucide-react";
import type { PrepReport } from "@data/lib/prep/types";
import { getConsequence, type AnswerVerdict } from "@data/lib/prep/consequence";
import { Badge, type BadgeColor } from "@data/components/common/Badge";
import { cn } from "@data/lib/cn";

const VERDICT: Record<AnswerVerdict, { color: BadgeColor; label: string; icon: typeof CircleCheck }> = {
  wrong: { color: "rose", label: "Conflicting answer", icon: AlertTriangle },
  risky: { color: "orange", label: "Leaks / untrustworthy", icon: ShieldAlert },
  ok: { color: "emerald", label: "Trustworthy", icon: CircleCheck },
};

// Shows what the RAG system would answer if this file were ingested as-is vs prepared.
export function ConsequenceSimulator({
  report,
  sampleId,
  cleared,
}: {
  report: PrepReport;
  sampleId?: string;
  cleared: boolean;
}) {
  const c = getConsequence(report, sampleId);
  const [view, setView] = useState<"asIs" | "prepared">("asIs");
  const a = view === "asIs" ? c.asIs : c.prepared;
  const v = VERDICT[a.verdict];

  return (
    <div>
      <div className="rounded-lg border border-line bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-sm">
          <MessageSquareText className="h-4 w-4 text-primary" />
          <span className="font-medium text-ink">A user asks the RAG system:</span>
        </div>
        <p className="mt-1 pl-6 text-sm italic text-slatey-200">“{c.question}”</p>
      </div>

      {/* toggle */}
      <div className="mt-4 flex gap-1 rounded-lg border border-line bg-white p-1">
        {(
          [
            ["asIs", "Ingest as-is"],
            ["prepared", "Ingest prepared"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === id ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* answer card */}
      <div
        className={cn(
          "mt-4 rounded-xl border p-4 transition-colors",
          a.verdict === "ok" ? "border-emerald-200 bg-emerald-50/50" : a.verdict === "wrong" ? "border-rose-200 bg-rose-50/50" : "border-orange-200 bg-orange-50/50",
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <v.icon
            className={cn("h-4 w-4", a.verdict === "ok" ? "text-emerald-600" : a.verdict === "wrong" ? "text-rose-600" : "text-orange-600")}
          />
          <Badge color={v.color}>{v.label}</Badge>
        </div>
        <p className="text-sm leading-relaxed text-ink">{a.answer}</p>
        <p className="mt-2 text-[13px] leading-snug text-slatey-300">{a.note}</p>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-soft/50 px-3 py-2 text-[13px] text-primary-dark">
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          {view === "asIs" ? (
            <>Switch to <strong>Ingest prepared</strong> to see the difference. Fixed by: {c.fixedBy}</>
          ) : cleared ? (
            <>This is what your prepared file produces. {c.fixedBy}</>
          ) : (
            <>This is the goal, clear the ingestion gate above and this becomes your file&apos;s real outcome.</>
          )}
        </span>
      </div>
    </div>
  );
}
