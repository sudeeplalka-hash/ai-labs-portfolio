"use client";

import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, Database, FlaskConical } from "lucide-react";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Live Data Lab",
    subtitle: "Upload a file and watch it get profiled, cleaned, cleared, and approved for AI ingestion.",
  },
  "/corpus": {
    title: "Corpus Builder",
    subtitle: "Profile many files at once — surface duplicates, stale versions, and conflicts before ingestion.",
  },
  "/overview": {
    title: "Executive Overview",
    subtitle: "The cost, throughput, and ROI of getting data ready for AI.",
  },
  "/pipeline": {
    title: "Technical Pipeline",
    subtitle: "Stage-by-stage detail of the preparation engine and the latest batch.",
  },
  "/guide": {
    title: "Prep & Guidelines Guide",
    subtitle: "What it takes to make data fit for ingestion — and why each step matters downstream.",
  },
};

export function Header({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const key = pathname === "/" ? "/" : "/" + (pathname.split("/")[1] ?? "");
  const meta = TITLES[key] ?? TITLES["/"];
  const isLab = key === "/" || key === "/corpus";

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenu}
            className="rounded-lg border border-line p-2 text-slatey-300 hover:bg-slate-100 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-ink md:text-xl">{meta.title}</h1>
              {isLab ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <FlaskConical className="h-3 w-3" /> Live feature
                </span>
              ) : (
                <span className="hidden items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-400/20 sm:inline-flex">
                  Control Tower · demo
                </span>
              )}
            </div>
            <p className="hidden text-sm text-slatey-400 sm:block">{meta.subtitle}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-slatey-300">
            <ShieldCheck className="h-3.5 w-3.5 text-status-healthy" />
            Private · in-browser
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-slatey-300">
            <Database className="h-3.5 w-3.5 text-primary" />
            Vector-ready output
          </span>
        </div>
      </div>
    </header>
  );
}
