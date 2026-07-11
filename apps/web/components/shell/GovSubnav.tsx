"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgram } from "@labs/program-core";
import { cn } from "@labs/design-system";

// Section nav for the Governance control plane (its original left sidebar is
// replaced by the shared command-center shell). The views are grouped so the
// section reads as a few clear areas rather than one long wall of tabs.
// Hidden until Govern is unlocked. Realize is now its own top-level lab.
const GROUPS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: "Overview",
    items: [{ href: "/govern", label: "Cockpit" }],
  },
  {
    label: "Control plane",
    items: [
      { href: "/govern/use-cases", label: "Use cases" },
      { href: "/govern/risk", label: "Risk" },
      { href: "/govern/policies", label: "Policies" },
      { href: "/govern/playground", label: "Playground" },
      { href: "/govern/evals", label: "Evals" },
    ],
  },
  {
    label: "Experiences",
    items: [
      { href: "/govern/live", label: "See it live" },
      { href: "/govern/arcade", label: "Red team arcade" },
      { href: "/govern/value", label: "What if calc" },
      { href: "/govern/maturity", label: "Maturity" },
    ],
  },
  {
    label: "Assurance",
    items: [
      { href: "/govern/audit-logs", label: "Audit log" },
      { href: "/govern/review-queue", label: "Review queue" },
      { href: "/govern/evidence", label: "Evidence" },
      { href: "/govern/readiness", label: "Readiness" },
      { href: "/govern/brief", label: "Board brief" },
    ],
  },
  {
    label: "Reference",
    items: [
      { href: "/govern/docs", label: "Docs" },
      { href: "/govern/settings", label: "Settings" },
    ],
  },
];

export function GovSubnav() {
  const pathname = usePathname();
  const { state, hydrated } = useProgram();
  if (!hydrated || state.progress.govern === "locked") return null;
  const active = (href: string) => (href === "/govern" ? pathname === "/govern" : pathname.startsWith(href));

  return (
    <nav className="mb-6 space-y-2 rounded-xl border border-line bg-white p-3 shadow-card" aria-label="Governance sections">
      {GROUPS.map((g) => (
        <div key={g.label} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slatey-500">{g.label}</span>
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {g.items.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                aria-current={active(s.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  active(s.href)
                    ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25"
                    : "text-slatey-400 hover:bg-slate-50 hover:text-ink",
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
