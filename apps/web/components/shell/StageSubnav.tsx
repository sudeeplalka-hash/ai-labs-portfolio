"use client";

// The ONE in-page section nav for every stage (R2.2). Renders the same
// STAGE_SECTIONS config the sidebar's trees use, so the two navigation surfaces
// can never disagree. Hash links (Deploy/Realize in-page sections) use plain
// anchors so the browser fires a native hashchange the views listen for, and the
// active item tracks the hash. Hidden while the stage is locked.
//
// TWO LAYOUTS, one config (2026-07-12):
//
//  · Pipeline (Build, Govern) — stages whose groups declare an `act`. These are the
//    only two stages that genuinely have three acts, so they get the editorial
//    three-column layout: question-first headings, all pages visible, and an
//    explicit Next. Forcing this onto Data (5 flat items) or Frame (2) would mean
//    inventing acts that don't exist.
//  · Chips (everything else) — the original flat/grouped rows, untouched.
//
// Design rules the pipeline layout is holding to, in case a future edit is tempted:
//  · ONE accent. Blue means exactly one thing: go here next. The page you are ON is
//    marked in ink, not colour. If you add a third blue thing, Next stops winning.
//  · The top rules carry the state (behind / here / ahead). That is POSITIONAL — it
//    is derived from where you are in an ordered pipeline, not from visit history.
//  · No checkmarks. There is no per-page visited state in this codebase
//    (useProgram.progress is Record<StageKey, StageStatus> — stage-level only, and
//    recent.ts keys lab scenarios by config, not pages). Rather than fake it, the
//    layout simply works without it.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, BookOpen, Play } from "lucide-react";
import { STAGE_SECTIONS, type StageSectionItem, type StageSectionGroup } from "@labs/kit";
import { useProgram, STAGES, type StageKey } from "@labs/program-core";
import { cn } from "@labs/design-system";

const norm = (p: string) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);

export function StageSubnav({ stage }: { stage: StageKey }) {
  const pathname = usePathname();
  const { state, hydrated } = useProgram();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash.replace("#", "") : "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  const groups = STAGE_SECTIONS[stage];
  if (!groups || !hydrated || state.progress[stage] === "locked") return null;

  const path = norm(pathname);
  const stageHref = STAGES.find((s) => s.key === stage)?.href ?? `/${stage}`;

  const active = (item: StageSectionItem, index: number) => {
    if (item.href.includes("#")) {
      const [p, key] = item.href.split("#");
      if (path !== norm(p)) return false;
      return hash ? hash === key : index === 0;
    }
    const href = norm(item.href);
    if (href === stageHref) return path === href;
    return path === href || path.startsWith(href + "/");
  };

  const isPipeline = groups.some((g) => !!g.act);
  return isPipeline
    ? <Pipeline stage={stage} groups={groups} active={active} />
    : <Chips stage={stage} groups={groups} active={active} />;
}

/* ---------------------------------------------------------------- pipeline */

function Pipeline({
  stage, groups, active,
}: {
  stage: StageKey;
  groups: StageSectionGroup[];
  active: (i: StageSectionItem, n: number) => boolean;
}) {
  const { state } = useProgram();
  const acts = groups.filter((g) => g.act);
  const utility = groups.filter((g) => g.utility).flatMap((g) => g.items);

  // The ordered spine of the stage: every act's items, in order. `Next` walks this.
  const spine = acts.flatMap((g) => g.items);
  const hereIndex = spine.findIndex((item, i) => active(item, i));

  // hereIndex === -1 means we're on a utility page (Guide, Overview, Cockpit) — it sits
  // OUTSIDE the spine. Next must then offer the START of the pipeline, not silently skip
  // the whole stage and hand off to Deploy. Reading the guide should walk you INTO the
  // lab, which is the entire point of having a guide.
  const onUtilityPage = hereIndex === -1;
  const nextItem = onUtilityPage
    ? spine[0]
    : hereIndex < spine.length - 1
      ? spine[hereIndex + 1]
      : undefined;

  // Which act are we standing in? Everything before it is behind us, everything
  // after is ahead. Purely positional — no visit history required.
  const actOfIndex = (idx: number) => {
    let seen = 0;
    for (let a = 0; a < acts.length; a++) {
      seen += acts[a].items.length;
      if (idx < seen) return a;
    }
    return -1;
  };
  const hereAct = hereIndex >= 0 ? actOfIndex(hereIndex) : -1;

  // At the end of the stage, Next hands off to the following stage. If that stage is
  // locked, say so instead of dead-ending into it.
  const order = STAGES.findIndex((s) => s.key === stage);
  const nextStage = order >= 0 && order < STAGES.length - 1 ? STAGES[order + 1] : undefined;
  const nextStageLocked = nextStage ? state.progress[nextStage.key] === "locked" : false;

  return (
    <nav className="mb-6 rounded-xl border border-line bg-white p-4 shadow-card md:p-5" aria-label={`${stage} sections`}>
      <div className="flex flex-col gap-5 md:flex-row md:gap-6">
        {acts.map((g, ai) => {
          const behind = hereAct >= 0 && ai < hereAct;
          const here = ai === hereAct;
          return (
            <div
              key={g.label ?? ai}
              className={cn(
                "min-w-0 flex-1 border-t-2 pt-2.5",
                // The rule IS the state. Ink behind you, blue where you stand, faint ahead.
                here ? "border-primary" : behind ? "border-ink" : "border-line",
              )}
            >
              <p className={cn("text-[13px] font-semibold", here ? "text-ink" : "text-slatey-400")}>{g.act}</p>
              {g.blurb && (
                <p className={cn("mt-0.5 text-[11px] leading-snug", here ? "text-slatey-400" : "text-slatey-500")}>{g.blurb}</p>
              )}
              <ul className="mt-2 space-y-0.5">
                {g.items.map((item) => {
                  const idx = spine.indexOf(item);
                  const isHere = idx === hereIndex;
                  const isNext = nextItem === item;
                  return (
                    <li key={item.href}>
                      <ItemLink
                        item={item}
                        isHere={isHere}
                        isNext={isNext}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3">
        {utility.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-1.5 text-xs text-slatey-400 transition-colors hover:text-ink"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
        <span className="flex-1" />
        {nextItem ? (
          <NextButton href={nextItem.href} label={nextItem.label} />
        ) : nextStage && !nextStageLocked ? (
          <NextButton href={nextStage.href} label={nextStage.label} />
        ) : nextStage && nextStageLocked ? (
          <span
            title={nextStage.reason}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-slatey-500"
          >
            {nextStage.label} is locked
          </span>
        ) : null}
      </div>
    </nav>
  );
}

// Blue is spent HERE and nowhere else in this nav: it means "go here next".
// The current page is ink — heavier, not louder.
function ItemLink({ item, isHere, isNext }: { item: StageSectionItem; isHere: boolean; isNext: boolean }) {
  const cls = cn(
    "-mx-1.5 flex items-center gap-1.5 rounded-md px-1.5 py-[3px] text-xs transition-colors",
    isHere ? "font-medium text-ink"
      : isNext ? "font-medium text-primary hover:bg-primary-soft"
      : "text-slatey-400 hover:text-ink",
  );
  const icon = isHere ? <Play className="h-3 w-3 shrink-0" aria-hidden="true" />
    : isNext ? <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
    : null;
  const body = <>{icon}{item.label}</>;
  return item.href.includes("#") ? (
    <a href={item.href} aria-current={isHere ? "page" : undefined} className={cls}>{body}</a>
  ) : (
    <Link href={item.href} aria-current={isHere ? "page" : undefined} className={cls}>{body}</Link>
  );
}

function NextButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
    >
      Next: {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}

/* ------------------------------------------------------------------- chips */
// Unchanged: Data, Deploy, Realize, Frame, Operate keep the flat/grouped rows.

function Chips({
  stage, groups, active,
}: {
  stage: StageKey;
  groups: StageSectionGroup[];
  active: (i: StageSectionItem, n: number) => boolean;
}) {
  const chip = (item: StageSectionItem, i: number) => {
    const act = active(item, i);
    const cls = cn(
      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
      act ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:bg-slate-50 hover:text-ink",
    );
    return item.href.includes("#") ? (
      <a key={item.href} href={item.href} aria-current={act ? "page" : undefined} className={cls}>{item.label}</a>
    ) : (
      <Link key={item.href} href={item.href} aria-current={act ? "page" : undefined} className={cls}>{item.label}</Link>
    );
  };

  const labeled = groups.some((g) => !!g.label);
  return (
    <nav
      className={cn("mb-6 rounded-xl border border-line bg-white shadow-card", labeled ? "space-y-2 p-3" : "flex flex-wrap items-center gap-1.5 p-2")}
      aria-label={`${stage} sections`}
    >
      {groups.map((g, gi) =>
        g.label ? (
          <div key={g.label} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slatey-500">{g.label}</span>
            <div className="flex flex-1 flex-wrap items-center gap-1.5">{g.items.map(chip)}</div>
          </div>
        ) : (
          <span key={gi} className="contents">{g.items.map(chip)}</span>
        ),
      )}
    </nav>
  );
}
