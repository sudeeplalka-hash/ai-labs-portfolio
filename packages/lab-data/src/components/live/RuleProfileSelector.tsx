"use client";

import { PROFILES, type ProfileId } from "@data/lib/prep/profiles";
import { cn } from "@data/lib/cn";

export function RuleProfileSelector({
  value,
  onChange,
}: {
  value: ProfileId;
  onChange: (id: ProfileId) => void;
}) {
  const active = PROFILES.find((p) => p.id === value) ?? PROFILES[0];
  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              value === p.id
                ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25"
                : "text-slatey-400 hover:text-ink",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-slatey-300">{active.blurb}</p>
    </div>
  );
}
