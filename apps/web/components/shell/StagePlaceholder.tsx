"use client";

import Link from "next/link";
import { Lock, ArrowLeft, CircleDot, Check } from "lucide-react";
import { Panel, Badge } from "@labs/design-system";
import { useProgram, STAGE_MAP, type StageKey } from "@labs/program-core";
import { LoadSampleButton } from "@/components/reviewer/SampleProgram";

// Gates are the lesson: a locked stage explains why and what unlocks it.
export function StagePlaceholder({ stageKey }: { stageKey: StageKey }) {
  const { state } = useProgram();
  const def = STAGE_MAP[stageKey];
  const status = state.progress[stageKey];
  const locked = status === "locked";
  const done = status === "done";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">Stage {def.n} · {def.sub}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{def.label}</h2>
          {locked ? <Badge tone="slate"><Lock className="h-3 w-3" /> Locked</Badge>
            : done ? <Badge tone="emerald"><Check className="h-3 w-3" /> Done</Badge>
            : <Badge tone="blue"><CircleDot className="h-3 w-3" /> Active</Badge>}
        </div>
        <p className="mt-2 max-w-2xl text-sm text-slatey-400">
          <span className="font-medium text-slatey-200">It answers:</span> {def.question}
        </p>
      </div>

      <Panel>
        <h3 className="text-base font-semibold text-ink">
          {locked ? "Locked: earlier stages aren't complete" : done ? "Complete" : "Ready when you are"}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slatey-300">{locked ? def.reason : def.will}</p>
        <p className="mt-3 text-xs text-slatey-500">Then it raises: <span className="italic">“{def.raises}”</span></p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <LoadSampleButton subtle label="Or load the sample program to unlock everything" />
        </div>
      </Panel>

      <Link href="/frame" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark">
        <ArrowLeft className="h-4 w-4" /> Back to Strategy &amp; Framing
      </Link>
    </div>
  );
}
