"use client";

// The in-stage navigation MODEL and its two views. Rendered by Header, which folds
// it into the sticky band — see Header.tsx for why they are one component now.
//
// Replaces StageSubnav (2026-07-12). That version rendered its own card inside
// <main>, which meant the page carried three stacked bands of chrome before any
// content: Header (~100px) + ProgramRail (~34px) + subnav card (~150px + margin)
// ≈ 310px. The Header's subtitle was also a prose restatement of the acts below it,
// and "New here? How this lab works" duplicated the Guide link in the utility row.
// Same thing said twice, in two boxes.
//
// TWO LAYOUTS, one config:
//  · Pipeline (Build, Govern) — stages whose groups declare an `act` in
//    STAGE_SECTIONS. These are the only two stages that genuinely have three acts.
//  · Chips (Data, Deploy, Realize) — flat lists. Forcing three columns onto five
//    items would mean inventing acts that don't exist.
//
// Rules a future edit should not quietly break:
//  · ONE accent. Blue means exactly one thing: go here next. The page you are ON is
//    marked in ink, not colour. Add a third blue thing and Next stops winning.
//  · The act rules carry the state (behind / here / ahead). That is POSITIONAL —
//    derived from where you are in an ordered pipeline, not from visit history.
//  · No checkmarks. There is no per-page visited state in this codebase
//    (useProgram.progress is Record<StageKey, StageStatus>; recent.ts keys lab
//    scenarios by config, not pages). Rather than fake it, the layout works without.
//  · Items are NOT truncated. Two-column act grids were considered and rejected:
//    they halve label width and reintroduce the exact clipping bug just removed from
//    the sidebar ("Strategy & Pla…"). The height win comes from the scroll collapse.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, BookOpen, Play } from "lucide-react";
import { STAGE_SECTIONS, type StageSectionItem, type StageSectionGroup } from "@labs/kit";
import { useProgram, STAGES, type StageKey } from "@labs/program-core";
import { cn } from "@labs/design-system";

const norm = (p: string) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);

export interface StageNavModel {
  stage: StageKey;
  isPipeline: boolean;
  acts: StageSectionGroup[];
  chipGroups: StageSectionGroup[];
  utility: StageSectionItem[];
  here?: StageSectionItem;
  hereAct?: StageSectionGroup;
  hereActIndex: number;
  next?: { href: string; label: string };
  nextLocked?: { label: string; reason?: string };
  isActive: (item: StageSectionItem, index: number) => boolean;
}

/** Null when the stage has no sections, is locked, or the store hasn't hydrated. */
export function useStageNav(stage: StageKey | undefined): StageNavModel | null {
  const pathname = usePathname();
  const { state, hydrated } = useProgram();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash.replace("#", "") : "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  const groups = stage ? STAGE_SECTIONS[stage] : undefined;

  return useMemo(() => {
    if (!stage || !groups || !hydrated || state.progress[stage] === "locked") return null;

    const path = norm(pathname);
    const stageHref = STAGES.find((s) => s.key === stage)?.href ?? `/${stage}`;

    const isActive = (item: StageSectionItem, index: number) => {
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
    const acts = groups.filter((g) => g.act);
    const chipGroups = groups;
    const utility = groups.filter((g) => g.utility).flatMap((g) => g.items);

    // The ordered spine: every act's items, in order. Next walks this. Note the order
    // WITHIN an act is curated, not causal — those items are facets of one question,
    // not dependent steps. Next is a suggested path, not a dependency chain.
    const spine = acts.flatMap((g) => g.items);
    const hereIndex = spine.findIndex((item, i) => isActive(item, i));

    // hereIndex === -1 means we're on a utility page (Guide, Overview, Cockpit) — it
    // sits OUTSIDE the spine. Next must then offer the START of the pipeline, not skip
    // the whole stage and hand off to the next one. Reading the guide should walk you
    // INTO the lab, which is the entire point of a guide.
    const onUtilityPage = hereIndex === -1;
    const nextItem = onUtilityPage
      ? spine[0]
      : hereIndex < spine.length - 1
        ? spine[hereIndex + 1]
        : undefined;

    const actOfIndex = (idx: number) => {
      let seen = 0;
      for (let a = 0; a < acts.length; a++) {
        seen += acts[a].items.length;
        if (idx < seen) return a;
      }
      return -1;
    };
    const hereActIndex = hereIndex >= 0 ? actOfIndex(hereIndex) : -1;

    // At the end of the stage, Next hands off to the following stage. If that stage is
    // locked, say so rather than dead-ending into it.
    const order = STAGES.findIndex((s) => s.key === stage);
    const following = order >= 0 && order < STAGES.length - 1 ? STAGES[order + 1] : undefined;
    const followingLocked = following ? state.progress[following.key] === "locked" : false;

    const next = nextItem
      ? { href: nextItem.href, label: nextItem.label }
      : following && !followingLocked
        ? { href: following.href, label: following.label }
        : undefined;
    const nextLocked = !nextItem && following && followingLocked
      ? { label: following.label, reason: following.reason }
      : undefined;

    return {
      stage, isPipeline, acts, chipGroups, utility,
      here: hereIndex >= 0 ? spine[hereIndex] : undefined,
      hereAct: hereActIndex >= 0 ? acts[hereActIndex] : undefined,
      hereActIndex,
      next, nextLocked, isActive,
    };
  }, [stage, groups, hydrated, state.progress, pathname, hash]);
}

/* --------------------------------------------------------------- full view */

export function StageNavFull({ m }: { m: StageNavModel }) {
  return (
    <nav aria-label={`${m.stage} sections`} className="min-w-0 flex-1">
      {m.isPipeline ? <Acts m={m} /> : <Chips m={m} />}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5">
        {m.utility.map((item) => (
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
        <NextControl m={m} />
      </div>
    </nav>
  );
}

function Acts({ m }: { m: StageNavModel }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      {m.acts.map((g, ai) => {
        const behind = m.hereActIndex >= 0 && ai < m.hereActIndex;
        const here = ai === m.hereActIndex;
        return (
          <div
            key={g.label ?? ai}
            className={cn(
              "min-w-0 flex-1 border-t-2 pt-2",
              // The rule IS the state: ink behind you, blue where you stand, faint ahead.
              here ? "border-primary" : behind ? "border-ink" : "border-line",
            )}
          >
            <p className={cn("text-[13px] font-semibold", here ? "text-ink" : "text-slatey-400")}>{g.act}</p>
            {g.blurb && (
              <p className={cn("mt-0.5 text-[11px] leading-snug", here ? "text-slatey-400" : "text-slatey-500")}>{g.blurb}</p>
            )}
            <ul className="mt-1.5 space-y-0.5">
              {g.items.map((item, i) => (
                <li key={item.href}>
                  <ItemLink
                    item={item}
                    isHere={m.here === item}
                    isNext={!!m.next && m.next.href === item.href && m.here !== item}
                    index={i}
                    isActive={m.isActive}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Chips({ m }: { m: StageNavModel }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {m.chipGroups
        .filter((g) => !g.utility)
        .flatMap((g) => g.items)
        .map((item, i) => {
          const act = m.isActive(item, i);
          const cls = cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            act ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:bg-slate-50 hover:text-ink",
          );
          return item.href.includes("#") ? (
            <a key={item.href} href={item.href} aria-current={act ? "page" : undefined} className={cls}>{item.label}</a>
          ) : (
            <Link key={item.href} href={item.href} aria-current={act ? "page" : undefined} className={cls}>{item.label}</Link>
          );
        })}
    </div>
  );
}

// Blue is spent HERE and nowhere else in this nav: it means "go here next".
// The current page is ink — heavier, not louder.
function ItemLink({
  item, isHere, isNext, index, isActive,
}: {
  item: StageSectionItem; isHere: boolean; isNext: boolean; index: number;
  isActive: (i: StageSectionItem, n: number) => boolean;
}) {
  const current = isHere || isActive(item, index);
  const cls = cn(
    "-mx-1.5 flex items-center gap-1.5 rounded-md px-1.5 py-[3px] text-xs transition-colors",
    current ? "font-medium text-ink"
      : isNext ? "font-medium text-primary hover:bg-primary-soft"
      : "text-slatey-400 hover:text-ink",
  );
  const icon = current ? <Play className="h-3 w-3 shrink-0" aria-hidden="true" />
    : isNext ? <ArrowRight className="h-3 w-3 shrink-0" aria-hidden="true" />
    : null;
  const body = <>{icon}{item.label}</>;
  return item.href.includes("#") ? (
    <a href={item.href} aria-current={current ? "page" : undefined} className={cls}>{body}</a>
  ) : (
    <Link href={item.href} aria-current={current ? "page" : undefined} className={cls}>{body}</Link>
  );
}

/* --------------------------------------------------------------- mini view */
// What survives the collapse: where you are, and the way forward. Nothing
// load-bearing is lost — you can keep moving without scrolling back up.

export function StageNavMini({ m, title }: { m: StageNavModel; title: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <span className="shrink-0 text-sm font-semibold text-ink">{title}</span>
      {m.hereAct?.act && (
        <>
          <span className="h-4 w-px shrink-0 bg-line" aria-hidden="true" />
          <span className="hidden truncate text-xs text-slatey-500 sm:block">{m.hereAct.act}</span>
        </>
      )}
      {m.here && (
        <>
          <span className="shrink-0 text-slatey-500" aria-hidden="true">›</span>
          <span className="truncate text-xs font-medium text-ink">{m.here.label}</span>
        </>
      )}
      <span className="flex-1" />
      <NextControl m={m} />
    </div>
  );
}

function NextControl({ m }: { m: StageNavModel }) {
  if (m.next) {
    return (
      <Link
        href={m.next.href}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
      >
        <span className="hidden sm:inline">Next:</span> {m.next.label}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    );
  }
  if (m.nextLocked) {
    return (
      <span
        title={m.nextLocked.reason}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-slatey-500"
      >
        {m.nextLocked.label} is locked
      </span>
    );
  }
  return null;
}
