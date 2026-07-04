"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@labs/design-system";
import {
  type Workshop, AI_PATTERNS, VALUE_DRIVERS, TIME_HORIZONS, SENSITIVITIES, DATA_STRUCTURES, IMPACTS, REGULATORY, LEVELS, YNU_OPTS,
} from "../../strategy/model";

type Set = (patch: Partial<Workshop>) => void;

// ---- field primitives -------------------------------------------------------
function Text({ label, value, onChange, area, ph }: { label: string; value: string; onChange: (v: string) => void; area?: boolean; ph?: string }) {
  const id = "f-" + label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div>
      <label htmlFor={id} className="stat-label mb-1 block">{label}</label>
      {area ? (
        <textarea id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slatey-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      ) : (
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={ph}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-slatey-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
      )}
    </div>
  );
}
function Chips({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="stat-label mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((o) => {
          const active = value === o;
          return (
            <button key={o} type="button" onClick={() => onChange(active ? "" : o)} aria-pressed={active}
              className={cn("rounded-md border px-2.5 py-1 text-xs transition-colors", active ? "border-ink bg-ink text-white" : "border-line bg-white text-slatey-300 hover:border-slatey-500 hover:text-ink")}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepCard({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ring-1 ring-inset", done ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slatey-400 ring-slate-300/40")}>{n}</span>
        <h3 className="flex-1 text-sm font-semibold text-ink">{title}</h3>
        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slatey-300" />}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const filled = (...v: string[]) => v.every((x) => x.trim().length > 0);

export function StrategyWorkshop({ w, set }: { w: Workshop; set: Set }) {
  return (
    <div className="space-y-4">
      <Text label="Initiative name" value={w.initiativeName} onChange={(v) => set({ initiativeName: v })} ph="e.g. Customer Support Knowledge Assistant" />

      <StepCard n={1} title="Business context" done={filled(w.sponsor, w.painPoint, w.targetUsers)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Business function" value={w.businessFunction} onChange={(v) => set({ businessFunction: v })} ph="e.g. Customer Operations" />
          <Text label="Sponsor / stakeholder" value={w.sponsor} onChange={(v) => set({ sponsor: v })} ph="e.g. VP, Customer Support" />
        </div>
        <Text label="Process or workflow impacted" value={w.process} onChange={(v) => set({ process: v })} ph="e.g. Level 1 support knowledge lookup" />
        <Text label="Current pain point" value={w.painPoint} onChange={(v) => set({ painPoint: v })} area ph="What's slow, costly, inconsistent, or risky today?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Target user group" value={w.targetUsers} onChange={(v) => set({ targetUsers: v })} ph="Who uses the output?" />
          <Chips label="Internal or customer-facing" options={["Internal", "Customer-facing"]} value={w.facing} onChange={(v) => set({ facing: v as Workshop["facing"] })} />
        </div>
      </StepCard>

      <StepCard n={2} title="AI ambition" done={filled(w.ambition, w.aiPattern)}>
        <Text label="What should AI help with?" value={w.ambition} onChange={(v) => set({ ambition: v })} area ph="Say it plainly — the wish behind the initiative." />
        <Chips label="AI pattern" options={AI_PATTERNS} value={w.aiPattern} onChange={(v) => set({ aiPattern: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Expected user action after the AI output" value={w.expectedAction} onChange={(v) => set({ expectedAction: v })} ph="What do they do with it?" />
          <Chips label="Human review required?" options={YNU_OPTS} value={w.humanReview} onChange={(v) => set({ humanReview: v as Workshop["humanReview"] })} />
        </div>
      </StepCard>

      <StepCard n={3} title="Business value" done={filled(w.baseline, w.target, w.valueDriver)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Current baseline metric" value={w.baseline} onChange={(v) => set({ baseline: v })} ph="e.g. 8.5 min average handle time" />
          <Text label="Target improvement" value={w.target} onChange={(v) => set({ target: v })} ph="e.g. 6.8 min within 90 days" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Number of users impacted" value={w.usersImpacted} onChange={(v) => set({ usersImpacted: v })} ph="e.g. 1,200" />
          <Text label="Frequency of use" value={w.frequency} onChange={(v) => set({ frequency: v })} ph="e.g. every ticket" />
        </div>
        <Chips label="Value driver" options={VALUE_DRIVERS} value={w.valueDriver} onChange={(v) => set({ valueDriver: v })} />
        <Chips label="Time horizon" options={TIME_HORIZONS} value={w.timeHorizon} onChange={(v) => set({ timeHorizon: v })} />
      </StepCard>

      <StepCard n={4} title="Data assumptions" done={filled(w.dataSources) && !!w.dataSensitivity}>
        <Text label="Primary data sources" value={w.dataSources} onChange={(v) => set({ dataSources: v })} area ph="Which documents, systems, or records feed it?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Data owner" value={w.dataOwner} onChange={(v) => set({ dataOwner: v })} ph="Who owns / maintains it?" />
          <Chips label="Data sensitivity" options={SENSITIVITIES} value={w.dataSensitivity} onChange={(v) => set({ dataSensitivity: v as Workshop["dataSensitivity"] })} />
        </div>
        <Text label="Known data gaps" value={w.dataGaps} onChange={(v) => set({ dataGaps: v })} area ph="Anything missing, messy, or outdated?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Chips label="Source freshness concern?" options={YNU_OPTS} value={w.freshnessConcern} onChange={(v) => set({ freshnessConcern: v as Workshop["freshnessConcern"] })} />
          <Chips label="Structured / unstructured / mixed" options={DATA_STRUCTURES} value={w.dataStructure} onChange={(v) => set({ dataStructure: v as Workshop["dataStructure"] })} />
        </div>
      </StepCard>

      <StepCard n={5} title="Risk & governance" done={!!w.impactIfWrong && (w.humanReview === "Yes" || w.humanReview === "No")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Chips label="Impact if the AI is wrong" options={IMPACTS} value={w.impactIfWrong} onChange={(v) => set({ impactIfWrong: v as Workshop["impactIfWrong"] })} />
          <Chips label="Regulatory exposure" options={REGULATORY} value={w.regulatory} onChange={(v) => set({ regulatory: v as Workshop["regulatory"] })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Chips label="Audit trail required?" options={YNU_OPTS} value={w.auditTrail} onChange={(v) => set({ auditTrail: v as Workshop["auditTrail"] })} />
          <Chips label="Citation / evidence required?" options={YNU_OPTS} value={w.citationRequired} onChange={(v) => set({ citationRequired: v as Workshop["citationRequired"] })} />
          <Chips label="Escalation path needed?" options={YNU_OPTS} value={w.escalationPath} onChange={(v) => set({ escalationPath: v as Workshop["escalationPath"] })} />
        </div>
      </StepCard>

      <StepCard n={6} title="Delivery complexity" done={!!w.workflowChange && !!w.adoptionComplexity}>
        <Text label="Required integrations" value={w.integrations} onChange={(v) => set({ integrations: v })} ph="Systems it must connect to" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Chips label="Workflow change level" options={LEVELS} value={w.workflowChange} onChange={(v) => set({ workflowChange: v as Workshop["workflowChange"] })} />
          <Chips label="Technical dependency level" options={LEVELS} value={w.techDependency} onChange={(v) => set({ techDependency: v as Workshop["techDependency"] })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Chips label="Adoption complexity" options={LEVELS} value={w.adoptionComplexity} onChange={(v) => set({ adoptionComplexity: v as Workshop["adoptionComplexity"] })} />
          <Chips label="Pilot timeline urgency" options={LEVELS} value={w.pilotUrgency} onChange={(v) => set({ pilotUrgency: v as Workshop["pilotUrgency"] })} />
        </div>
      </StepCard>
    </div>
  );
}
