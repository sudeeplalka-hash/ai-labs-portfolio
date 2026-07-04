import { Gauge } from "lucide-react";
import { currentRun } from "@rag/data/evaluationRuns";
import { calculateProductionReadinessLevel } from "@rag/lib/scoring";

const LEVELS = ["Basic Demo", "Measured Prototype", "Controlled Pilot", "Production Managed", "Enterprise Scale"];

export function ReadinessCard() {
  const score = currentRun.metrics.overallScore;
  const readiness = calculateProductionReadinessLevel(score);
  return (
    <div className="panel p-5 animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-accent-cyan" />
        <h2 className="text-sm font-semibold text-ink">Production Readiness</h2>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-ink">Level {readiness.level}</span>
        <span className="text-sm text-slatey-400">of 5</span>
      </div>
      <p className="mt-1 text-sm font-medium text-accent-cyan">{readiness.name}</p>

      <div className="mt-4 space-y-2">
        {LEVELS.map((name, i) => {
          const lvl = i + 1;
          const active = lvl === readiness.level;
          const done = lvl < readiness.level;
          return (
            <div key={name} className="flex items-center gap-3">
              <span
                className={
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold " +
                  (active
                    ? "bg-accent text-navy-950"
                    : done
                    ? "bg-accent/20 text-accent-cyan"
                    : "bg-slate-50 text-slatey-500")
                }
              >
                {lvl}
              </span>
              <span className={"text-xs " + (active ? "font-semibold text-ink" : "text-slatey-400")}>
                {name}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slatey-400">
        Overall quality of {score}% places the system at Level 3. Reaching Level 4 requires citation accuracy at target,
        zero critical failures, P95 within SLA, and continuous monitoring on live traffic.
      </p>
    </div>
  );
}
