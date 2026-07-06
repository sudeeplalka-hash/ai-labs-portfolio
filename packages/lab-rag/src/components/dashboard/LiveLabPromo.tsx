import Link from "next/link";
import { FlaskConical, ArrowRight, Upload, Search, Brain } from "lucide-react";

// Eye-catching call-to-action on the landing page that pulls visitors into the
// interactive lab, the most engaging part of the project.
export function LiveLabPromo() {
  const steps = [
    { icon: Upload, label: "Upload a doc" },
    { icon: Search, label: "Ask a question" },
    { icon: Brain, label: "See the evaluation" },
  ];
  return (
    <Link
      href="/build"
      className="group relative block overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-r from-accent/20 via-accent-cyan/10 to-transparent p-5 shadow-glow transition-all hover:border-accent/50 sm:p-6 animate-fade-in"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-cyan shadow-glow">
            <FlaskConical className="h-6 w-6 text-navy-950" strokeWidth={2.5} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-950">
                Interactive
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-accent-cyan">Try it yourself</span>
            </div>
            <h2 className="mt-1.5 text-lg font-semibold text-ink">Run the Live RAG Evaluator Lab</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slatey-300">
              Upload a document, ask a question, and watch the evaluator score retrieval, citations, grounding, and hallucination
              risk in real time. No setup, no API keys, it runs right here.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slatey-300">
                  <s.icon className="h-4 w-4 text-accent-cyan" />
                  {s.label}
                </div>
                {i < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-slatey-600" />}
              </div>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-navy-950 transition-transform group-hover:translate-x-0.5">
            Open the Lab <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
