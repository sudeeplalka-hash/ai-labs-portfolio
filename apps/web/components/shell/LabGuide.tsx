import type { LucideIcon } from "lucide-react";
import { PageIntro } from "@labs/design-system";
import { GuideTaskLink } from "./GuideTaskLink";

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
  taskHref,
  firstSuccess,
}: {
  stage: string;
  title: string;
  intro: string;
  icon?: LucideIcon;
  steps: GuideStep[];
  closing: string;
  closingIcon: LucideIcon;
  taskHref?: string;
  firstSuccess?: string;
}) {
  return (
    <article aria-label={title}>
      <PageIntro eyebrow={stage} title={title} icon={icon}>{intro}</PageIntro>
      <section aria-labelledby="guide-first-success" className="mb-5 rounded-xl border border-primary/25 bg-primary-soft p-4 print:break-inside-avoid">
        <h3 id="guide-first-success" className="font-semibold text-ink">Your first useful result</h3>
        <p className="mt-2 text-sm leading-relaxed text-slatey-300">{firstSuccess ?? (steps[0] ? `Start with “${steps[0].title}”. ${steps[0].why}` : intro)}</p>
        <div className="no-print mt-3"><GuideTaskLink href={taskHref} label="Open the lab and try it" /></div>
      </section>
      <nav aria-label="Guide contents" className="no-print mb-6 rounded-xl border border-line bg-white p-4">
        <p className="mb-2 text-sm font-semibold">Follow the task</p>
        <ol className="grid gap-2 text-sm sm:grid-cols-2">{steps.map((step, index) => <li key={step.title}><a href={`#guide-step-${index + 1}`} className="inline-flex gap-2 rounded py-1 text-primary underline-offset-4 hover:underline"><span className="tabular-nums">{index + 1}.</span>{step.title}</a></li>)}</ol>
      </nav>

      <div className="grid gap-5 lg:grid-cols-2">
        {steps.map((s, i) => (
          <section key={i} id={`guide-step-${i + 1}`} aria-labelledby={`guide-step-heading-${i + 1}`} className="scroll-mt-24 rounded-xl border border-line bg-white p-5 shadow-card print:break-inside-avoid print:shadow-none">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                <s.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <span className="font-mono text-[11px] text-slatey-400">STEP {i + 1}</span>
                <h3 id={`guide-step-heading-${i + 1}`} className="text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slatey-300">{s.body}</p>
                <p className="mt-2 text-[13px] leading-snug text-primary-dark">{s.why}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary-soft/50 px-4 py-3 text-sm font-medium text-primary-dark print:break-inside-avoid">
        <ClosingIcon className="h-4 w-4 shrink-0" />
        {closing}
      </div>
      <div className="no-print mt-5"><GuideTaskLink href={taskHref} label="Return to the lab" /></div>
    </article>
  );
}
