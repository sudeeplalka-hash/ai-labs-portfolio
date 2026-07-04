"use client";

// Phase A — live/demo clarity. The Govern landing page runs the live evidence
// loop; the older control-plane subroutes render a curated demo dataset. This
// banner makes that boundary explicit on every legacy subroute.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, ArrowRight } from "lucide-react";

// Routes that are fully live-wired (no banner needed).
const LIVE_ROUTES = new Set(["/govern", "/govern/"]);

export function GovSampleBanner() {
  const pathname = usePathname();
  if (LIVE_ROUTES.has(pathname)) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-50/60 px-3 py-2 text-[13px] text-amber-900">
      <span className="inline-flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span><b>Sample governance data.</b> This control-plane page renders a curated demo dataset.</span>
      </span>
      <Link href="/govern" className="inline-flex items-center gap-1 font-semibold text-amber-800 underline-offset-2 hover:underline">
        Govern the live initiative <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
