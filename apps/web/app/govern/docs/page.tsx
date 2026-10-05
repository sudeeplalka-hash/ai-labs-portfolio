import { routeMetadata } from "@/lib/site";
export const metadata = routeMetadata("Governance documentation", "Inspect governance documentation through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/govern/docs");
export default function Docs() {
  const sections = [
    {
      title: "Product Overview",
      content: `The Enterprise AI Governance Control Plane shows how enterprise GenAI and agentic systems can be registered, risk tiered, governed with policy as code, tested through red team evals, monitored at runtime, escalated to human reviewers, and exported as audit ready evidence.

The sample registry and browser models let executives inspect risk posture and engineers inspect controls. Use the Executive / Technical lens to switch density. Current-program release gates remain separate from the broader sample registry.`
    },
    {
      title: "Architecture",
      content: `Frontend: Next.js 14 + TypeScript + Tailwind + Recharts (static export friendly).
Backend: FastAPI + Python + SQLAlchemy + SQLite, provider agnostic model gateway (AI_PROVIDER=mock by default).

Policies live as code in policies/*.yaml; red team suites in evals/*.json; control to framework mappings in app/core/frameworks.py. This deployment runs fully client side in static demo mode, the same governance engine is ported to TypeScript so every decision is reproducible with no backend.`
    },
    {
      title: "Governance Pipeline",
      content: `Every AI request flows through:
1. Risk scoring, prompt and use case risk assessed deterministically
2. Input guardrails, injection, PII, toxicity, bias, financial, tool action checks
3. Model gateway, mock or live response generated
4. Output guardrails, unsupported claim and citation checks on the response
5. Decision engine, highest precedence action selected (BLOCK > ESCALATE > REQUIRE_CONFIRMATION > REDACT > REWRITE > ALLOW_WITH_DISCLAIMER > LOG_ONLY > ALLOW)
6. Audit, event written to a tamper evident, hash chained log
7. Human review, escalated items queued with SLAs`
    },
    {
      title: "Guardrails (8)",
      content: `1. Prompt Injection, blocks directive overrides, jailbreaks, token injection
2. Sensitive Data / PII, redacts SSN, card, email, phone, passport, DOB
3. Unsupported Claims, disclaims overconfident or unsourced assertions
4. Regulated Financial Recommendation, escalates credit and investment decisions
5. Tool Action Risk, escalates / confirms destructive or high impact actions
6. Toxicity / Professional Conduct, blocks abusive content
7. Bias / Protected Class, blocks decisions based on protected attributes
8. Citation Required, flags RAG answers lacking sources

This hosted browser model uses deterministic rules. Its confidence values summarize modeled signals; they are not statistical calibration or a guarantee of safety. Backend-only options are separate from the browser implementation.`
    },
    {
      title: "Governance Decisions",
      content: `ALLOW, passed all checks
ALLOW_WITH_DISCLAIMER, passed with an advisory note
REDACT, PII or sensitive content removed
REWRITE, response rewritten for compliance
REQUIRE_CONFIRMATION, user must confirm before proceeding
ESCALATE, sent to a human reviewer
BLOCK, request rejected outright
LOG_ONLY, allowed but flagged for audit`
    },
    {
      title: "Assurance & Evidence",
      content: `Audit integrity, the static deployment exposes an embedded sample verification record. New browser-session events are inspectable but are not part of that sample hash chain. A connected backend may supply a fresh verification result.
Red team evals, available suites exercise the rule pipeline. Inspect the run's cases and results; the browser sample does not retain evaluation run history for evidence reports.
Framework mapping, every policy maps to NIST AI RMF 1.0, the EU AI Act, and ISO/IEC 42001.
RBAC, Analyst / Reviewer / Auditor / Admin personas demonstrate separation of duties in the browser. They are not authentication or a server authorization boundary.
Evidence, drafts contain current case and policy snapshots plus event/review records in the requested period. Section coverage counts available records, not controls passed or compliance certification.`
    },
    {
      title: "Interactive Lab",
      content: `See it Live, the same risky prompt with and without governance, side by side.
Red Team Arcade, try to break the AI; the control plane scores every contained attack.
Business Case, an interactive ROI model (cost avoided, hours saved, time to launch).
Maturity Index, a 6 question self assessment placing you on a crawl/walk/run/fly curve.
Regulatory Readiness, control coverage mapped to EU AI Act / NIST / ISO.
Board Brief, generate a screenshot ready one pager for the board.`
    },
    {
      title: "Demo Script",
      content: `1. See it Live, run "Ignore all previous instructions" (BLOCK), an SSN (REDACT), a credit decision (ESCALATE).
2. Red Team Arcade, fire a few attacks; watch containment hold.
3. Executive Cockpit, portfolio posture and the value strip.
4. Policy Workbench, open a policy; see the YAML and its framework mapping.
5. Human Review Queue, switch role to Reviewer and action an item.
6. Eval Lab, run a suite, then Compare runs.
7. Audit Log Explorer, inspect the available verification record and its scope.
8. Board Brief, generate the one pager.`
    },
    {
      title: "Setup",
      content: `The hosted sample needs no API key. Start with a sample prompt in the Runtime Playground.

For an optional real model response, open Model & connection, choose an OpenAI-compatible endpoint and enter your own model and key. The key remains in this browser's local storage and is sent to that endpoint. A failed call can fall back to a mock response; check the mode on the actual result.

Repository setup and the optional governance service are documented separately in the project's README and operating instructions.`
    },
  ];

  return (
    <article className="p-4 sm:p-8 max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Reference</p>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">Architecture Guide</h2>
        <p className="text-sm text-slate-500 mt-1">Follow a case from risk inputs to controls, review and evidence. Start with a sample, then use the reference sections below.</p>
        <a href="/govern/playground" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">First task: run a sample governance check</a>
      </div>
      <nav aria-label="Architecture guide contents" className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-semibold">On this page</h3><ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{sections.map((section, index) => <li key={section.title}><a href={`#govern-doc-${index}`} className="text-primary underline">{section.title}</a></li>)}</ol></nav>
      {sections.map((s, index) => (
        <section id={`govern-doc-${index}`} key={s.title} className="scroll-mt-28 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 print:break-inside-avoid">
          <h3 className="font-semibold text-slate-800 mb-3">{s.title}</h3>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">{s.content.split('\n\n').map((paragraph, paragraphIndex) => <p key={paragraphIndex} className="whitespace-pre-line">{paragraph}</p>)}</div>
        </section>
      ))}
      <a href="/govern/playground" className="inline-block rounded py-2 text-sm font-semibold text-primary underline">Return to the Runtime Playground</a>
    </article>
  );
}
