"use client";

import { useProgram } from "@labs/program-core";

// Per-page intro: the lab's own framing, shown for everyone.
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  const { hydrated } = useProgram();
  if (!hydrated) return null;
  return (
    <div className="mb-6 animate-fade-in">
      {eyebrow && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-accent-cyan">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      {children && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-300">{children}</p>}
    </div>
  );
}
