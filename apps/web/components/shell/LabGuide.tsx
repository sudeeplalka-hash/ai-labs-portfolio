import type { LucideIcon } from "lucide-react";
import { PageIntro } from "@labs/design-system";

export type GuideStep = { icon: LucideIcon; title: string; body: string; why: string };

// Shared "how this lab works" guide: a plain-language walkthrough of what the lab
// builds and why each step matters. Same shape across every lab for consistency.
export function LabGuide({
  stage,
  title,
  intro,
  icon,
  steps,
  closing,
  closingIcon: ClosingIcon,
}: {
  stage: string;
  title: string;
  intro: string;
  icon?: LucideIcon;
  steps: GuideStep[];
  closing: string;
  closingIcon: LucideIcon;
}) {
  return (
    <div>
      <PageIntro eyebrow={stage} title={title} icon={icon}>{intro}</PageIntro>

      <div className="grid gap-5 lg:grid-cols-2">
        {steps.map((s, i) => (
          <div key={i} className="rounded-xl border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-cardhover">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                <s.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <span className="font-mono text-[11px] text-slatey-400">STEP {i + 1}</span>
                <h3 className="text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slatey-300">{s.body}</p>
                <p className="mt-2 text-[13px] leading-snug text-primary-dark">{s.why}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-soft/50 px-4 py-3 text-center text-sm font-medium text-primary-dark">
        <ClosingIcon className="h-4 w-4 shrink-0" />
        {closing}
      </div>
    </div>
  );
}
