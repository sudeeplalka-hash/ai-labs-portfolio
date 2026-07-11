"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgram } from "@labs/program-core";
import { cn } from "@labs/design-system";

const SECTIONS: { href: string; label: string }[] = [
  { href: "/build", label: "Live Evaluator" },
  { href: "/build/overview", label: "Overview" },
  { href: "/build/evaluations", label: "Evaluations" },
  { href: "/build/traces", label: "Traces" },
  { href: "/build/dataset", label: "Golden Dataset" },
  { href: "/build/retrieval", label: "Retrieval" },
  { href: "/build/answers", label: "Answers" },
  { href: "/build/failures", label: "Failures" },
  { href: "/build/quality-gates", label: "Quality Gates" },
];

export function BuildSubnav() {
  const pathname = usePathname();
  const { state, hydrated } = useProgram();
  if (!hydrated || state.progress.build === "locked") return null;
  const active = (href: string) => (href === "/build" ? pathname === "/build" : pathname.startsWith(href));

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white p-2 shadow-card" aria-label="Build sections">
      {SECTIONS.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={active(s.href) ? "page" : undefined}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            active(s.href) ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:bg-slate-50 hover:text-ink",
          )}
        >
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
