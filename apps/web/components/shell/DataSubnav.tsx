"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgram } from "@labs/program-core";
import { cn } from "@labs/design-system";

const SECTIONS: { href: string; label: string }[] = [
  { href: "/data", label: "Live Data Lab" },
  { href: "/data/overview", label: "Overview" },
  { href: "/data/corpus", label: "Corpus" },
  { href: "/data/pipeline", label: "Pipeline" },
  { href: "/data/guide", label: "Guide" },
];

export function DataSubnav() {
  const pathname = usePathname();
  const { state, hydrated } = useProgram();
  if (!hydrated || state.progress.data === "locked") return null;
  const active = (href: string) => (href === "/data" ? pathname === "/data" : pathname.startsWith(href));

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-white p-2 shadow-card" aria-label="Data sections">
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
