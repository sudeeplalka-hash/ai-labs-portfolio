"use client";

import { useState } from "react";
import { Tags, Check, Undo2, HelpCircle } from "lucide-react";
import type { TopicGroup } from "@data/lib/prep/topics";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { Badge } from "@data/components/common/Badge";
import { cn } from "@data/lib/cn";

// Topic groups (Phase 4). Suggestions are deterministic top-terms from the
// corpus vocabulary; NOTHING becomes metadata until a person confirms or
// renames a label here. Confirmed groups draw hulls on the Atlas and enrich
// the Data Readiness Handoff's metadata requirements.

export function TopicGroups({
  topics,
  confirmed,
  onConfirm,
  onUnconfirm,
}: {
  topics: TopicGroup[];
  confirmed: Record<string, string>;
  onConfirm: (id: string, label: string) => void;
  onUnconfirm: (id: string) => void;
}) {
  if (topics.length === 0) return null;
  return (
    <Panel>
      <SectionHeader
        title="Topic groups"
        description="Deterministic term clusters, suggested labels only become metadata when you confirm them"
        icon={Tags}
      />
      <ul className="grid gap-2 sm:grid-cols-2">
        {topics.map((t) => (
          <TopicRow key={t.id} t={t} confirmedLabel={confirmed[t.id]} onConfirm={onConfirm} onUnconfirm={onUnconfirm} />
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-slatey-500">
        How this is built: deterministic k-means over term-frequency vectors (same engine family as the Atlas), labels
        suggested from each group&apos;s dominant terms. Groups with thin signal say so instead of guessing.
      </p>
    </Panel>
  );
}

function TopicRow({
  t,
  confirmedLabel,
  onConfirm,
  onUnconfirm,
}: {
  t: TopicGroup;
  confirmedLabel?: string;
  onConfirm: (id: string, label: string) => void;
  onUnconfirm: (id: string) => void;
}) {
  const [draft, setDraft] = useState(t.unsure ? "" : t.suggestedLabel);
  const isConfirmed = confirmedLabel !== undefined;

  return (
    <li className={cn("rounded-lg border p-2.5", isConfirmed ? "border-primary/30 bg-primary-soft/30" : "border-line bg-white")}>
      <div className="flex items-center gap-1.5">
        {t.unsure && !isConfirmed && (
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
            <HelpCircle className="h-3 w-3" /> unsure
          </span>
        )}
        {isConfirmed ? (
          <>
            <Badge color="blue">{confirmedLabel}</Badge>
            <span className="text-[11px] text-slatey-500">confirmed topic</span>
            <button onClick={() => onUnconfirm(t.id)} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-line px-2 py-0.5 text-[11px] font-medium text-slatey-300 hover:text-ink">
              <Undo2 className="h-3 w-3" /> Undo
            </button>
          </>
        ) : (
          <>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.unsure ? "Name this group yourself…" : t.suggestedLabel}
              aria-label={`Label for topic group with ${t.memberNames.join(", ")}`}
              className="w-40 flex-1 rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium text-ink placeholder:text-slatey-500 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
            <button
              onClick={() => draft.trim() && onConfirm(t.id, draft.trim())}
              disabled={!draft.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-3 w-3" /> Confirm
            </button>
          </>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {t.memberNames.map((n) => (
          <span key={n} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slatey-400">{n}</span>
        ))}
      </div>
      {!t.unsure && !isConfirmed && (
        <p className="mt-1 text-[10px] text-slatey-500">top terms: {t.topTerms.join(", ")}</p>
      )}
    </li>
  );
}
