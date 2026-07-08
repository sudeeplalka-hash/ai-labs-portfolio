"use client";

import { useEffect, useRef, useState } from "react";
import { GitMerge, Check, Undo2, ShieldAlert, Copy, Layers } from "lucide-react";
import type { DuplicateSet } from "@data/lib/prep/resolution";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { Badge, type BadgeColor } from "@data/components/common/Badge";
import { cn } from "@data/lib/cn";

// Version & Duplicate Resolution (Phase 2). Each detected set carries a
// deterministic recommendation (keep the authoritative copy, quarantine the
// rest). Accepting writes real exclusions: the star map, health strip, board,
// and the Data Readiness Handoff's blocked sources all move together.

export interface SetResolution {
  /** File chosen to keep; null = keep everything (dismiss the recommendation). */
  keepId: string | null;
}

const KIND_META: Record<DuplicateSet["kind"], { label: string; color: BadgeColor; icon: typeof Copy }> = {
  version: { label: "Version conflict", color: "amber", icon: ShieldAlert },
  duplicate: { label: "Duplicate", color: "rose", icon: Copy },
  overlap: { label: "Overlap", color: "slate", icon: Layers },
};

export function DuplicateResolution({
  sets,
  resolutions,
  focusSetId,
  onResolve,
  onUndo,
}: {
  sets: DuplicateSet[];
  resolutions: Record<string, SetResolution>;
  focusSetId: string | null;
  onResolve: (setId: string, keepId: string | null) => void;
  onUndo: (setId: string) => void;
}) {
  const refs = useRef<Record<string, HTMLLIElement | null>>({});
  useEffect(() => {
    if (focusSetId && refs.current[focusSetId]) {
      refs.current[focusSetId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusSetId]);

  const openSets = sets.filter((s) => !(s.id in resolutions));
  const resolved = sets.filter((s) => s.id in resolutions);

  return (
    <Panel>
      <SectionHeader
        title="Version & duplicate resolution"
        description="Detected sets with a recommended keeper, accept, override, or keep everything"
        icon={GitMerge}
      />
      {sets.length === 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-700">
          No duplicate or conflicting documents detected across the corpus.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {openSets.map((s) => (
            <OpenSet key={s.id} s={s} focused={focusSetId === s.id} onResolve={onResolve} setRef={(el) => { refs.current[s.id] = el; }} />
          ))}
          {resolved.map((s) => {
            const r = resolutions[s.id];
            const keptAll = r.keepId === null;
            const keeper = keptAll ? null : s.memberNames[s.memberIds.indexOf(r.keepId!)];
            const droppedNames = keptAll ? [] : s.memberNames.filter((_, i) => s.memberIds[i] !== r.keepId);
            return (
              <li key={s.id} ref={(el) => { refs.current[s.id] = el; }} className={cn("rounded-lg border border-line bg-slate-50/60 p-2.5", focusSetId === s.id && "ring-1 ring-primary/50")}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-status-healthy" />
                  <Badge color={KIND_META[s.kind].color}>{KIND_META[s.kind].label}</Badge>
                  <span className="text-xs text-slatey-300">
                    {keptAll ? "Kept all copies (recommendation dismissed)" : (
                      <>kept <span className="font-mono font-medium text-ink">{keeper}</span> · excluded {droppedNames.map((n, i) => (
                        <span key={n} className="font-mono">{i > 0 ? ", " : ""}{n}</span>
                      ))}</>
                    )}
                  </span>
                  <button onClick={() => onUndo(s.id)} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-line px-2 py-0.5 text-[11px] font-medium text-slatey-300 hover:text-ink">
                    <Undo2 className="h-3 w-3" /> Undo
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function OpenSet({
  s,
  focused,
  onResolve,
  setRef,
}: {
  s: DuplicateSet;
  focused: boolean;
  onResolve: (setId: string, keepId: string | null) => void;
  setRef: (el: HTMLLIElement | null) => void;
}) {
  const [keepId, setKeepId] = useState(s.recommendation.keepId);
  const meta = KIND_META[s.kind];
  const Icon = meta.icon;
  return (
    <li ref={setRef} className={cn("rounded-lg border border-line p-3", focused && "ring-1 ring-primary/60")}>
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="h-4 w-4 text-slatey-300" />
        <Badge color={meta.color}>{meta.label}</Badge>
        <span className="font-mono text-[11px] text-slatey-400">{Math.round(s.maxSimilarity * 100)}% overlap · {s.memberIds.length} files</span>
      </div>

      <fieldset className="mt-2 space-y-1">
        <legend className="sr-only">Choose the copy to keep for this set</legend>
        {s.memberIds.map((id, i) => (
          <label
            key={id}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5",
              keepId === id ? "border-primary/40 bg-primary-soft/40" : "border-line bg-white hover:bg-slate-50",
            )}
          >
            <input
              type="radio"
              name={`keep-${s.id}`}
              checked={keepId === id}
              onChange={() => setKeepId(id)}
              className="accent-primary"
              aria-label={`Keep ${s.memberNames[i]}`}
            />
            <span className="truncate font-mono text-[12px] text-slatey-100">{s.memberNames[i]}</span>
            {s.recommendation.keepId === id && <Badge color="blue">recommended</Badge>}
          </label>
        ))}
      </fieldset>

      <p className="mt-2 text-[13px] leading-snug text-slatey-300">{s.recommendation.why}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onResolve(s.id, keepId)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
        >
          <Check className="h-3.5 w-3.5" /> Keep this copy, exclude {s.memberIds.length - 1} other{s.memberIds.length > 2 ? "s" : ""}
        </button>
        <button
          onClick={() => onResolve(s.id, null)}
          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-slatey-300 hover:text-ink"
        >
          Keep all
        </button>
      </div>
    </li>
  );
}
