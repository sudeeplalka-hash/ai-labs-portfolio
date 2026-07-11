"use client";

// Phase B, the persistent program rail. One slim strip under the header with a
// chip per stage: status dot, label, and the stage's live headline number, all
// derived on the fly by program-core selectors (never dependent on which pages
// have been visited). Ends with a release-blocker pill when evidence is failing.

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  useProgramSource, selectStageHeadlines, selectReleaseBlockers, STAGES,
  type StageStatus,
} from "@labs/program-core";
import { cn } from "@labs/design-system";

const dotCls = (status: StageStatus) =>
  status === "done" ? "bg-emerald-500" : status === "active" ? "bg-sky-500" : "bg-slate-300";

export function ProgramRail() {
  const { src, hydrated } = useProgramSource();
  const pathname = usePathname();

  const headlines = useMemo(() => selectStageHeadlines(src), [src]);
  const blockers = useMemo(() => selectReleaseBlockers(src), [src]);

  // The homepage tells the loop its own way, the rail starts once you're inside.
  if (!hydrated || pathname === "/") return null;

  const byKey = Object.fromEntries(headlines.map((h) => [h.key, h]));
  const hasAny = headlines.some((h) => h.value !== null);

  return (
    <nav aria-label="Program rail" className="no-print border-b border-line bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1 overflow-x-auto px-5 py-1.5 md:px-8">
        {STAGES.map((s, i) => {
          const h = byKey[s.key];
          const active = pathname === s.href || pathname.startsWith(s.href + "/");
          return (
            <span key={s.key} className="flex items-center">
              {i > 0 && <span className="mx-0.5 text-slate-300">›</span>}
              <Link
                href={s.href}
                title={h?.detail ?? s.question}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  active ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20" : "text-slatey-400 hover:bg-slate-50 hover:text-ink",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", dotCls(src.progress[s.key]))} />
                {s.short}
                <span className={cn("font-mono font-semibold", h?.value ? "text-ink" : "text-slate-300")}>
                  {h?.value ?? "N/A"}
                </span>
              </Link>
            </span>
          );
        })}

        <span className="ml-auto shrink-0 pl-3">
          {blockers.length > 0 ? (
            <Link
              href="/deploy"
              title={blockers.slice(0, 3).map((b) => `• ${b.text}`).join("\n")}
              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100"
            >
              <AlertTriangle className="h-3 w-3" /> {blockers.length} release blocker{blockers.length > 1 ? "s" : ""}
            </Link>
          ) : hasAny ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              No release blockers
            </span>
          ) : null}
        </span>
      </div>
    </nav>
  );
}
