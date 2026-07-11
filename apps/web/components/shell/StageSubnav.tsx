"use client";

// The ONE in-page section nav for every stage (R2.2). Renders the same
// STAGE_SECTIONS config the sidebar's trees use, so the two navigation
// surfaces can never disagree. Grouped stages (Build, Govern) render the
// grouped rows pattern; single unlabeled groups render as a flat chip row.
// Hash links (Deploy/Realize in-page sections) use plain anchors so the
// browser fires a native hashchange the views listen for, and the active
// chip tracks the hash. Hidden while the stage is locked.
// Replaces DataSubnav / BuildSubnav / GovSubnav.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { STAGE_SECTIONS, type StageSectionItem } from "@labs/kit";
import { useProgram, type StageKey } from "@labs/program-core";
import { cn } from "@labs/design-system";

export function StageSubnav({ stage }: { stage: StageKey }) {
  const pathname = usePathname();
  const { state, hydrated } = useProgram();
  const [hash, setHash] = useState("");

  // Track the URL hash so Deploy/Realize section items can highlight.
  useEffect(() => {
    const read = () => setHash(typeof window !== "undefined" ? window.location.hash.replace("#", "") : "");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [pathname]);

  const groups = STAGE_SECTIONS[stage];
  if (!groups || !hydrated || state.progress[stage] === "locked") return null;

  const norm = (p: string) => (p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p);
  const path = norm(pathname);
  const stageHref = `/${stage === "frame" ? "frame" : stage}`;
  const active = (item: StageSectionItem, index: number) => {
    if (item.href.includes("#")) {
      const [p, key] = item.href.split("#");
      if (path !== norm(p)) return false;
      return hash ? hash === key : index === 0; // first section active when no hash
    }
    const href = norm(item.href);
    if (href === stageHref) return path === href;
    return path === href || path.startsWith(href + "/");
  };

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
