"use client";

import { useState } from "react";
import { cn } from "@rag/lib/cn";

export function Tabs({
  tabs,
  className,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  className?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-line bg-navy-900/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active === t.id
                ? "bg-primary/10 text-primary ring-1 ring-inset ring-accent/30"
                : "text-slatey-400 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
