import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

// Anonymized real engagements, walkable by a reviewer. Client names are sector descriptors and
// every figure is directionally representative + adjusted to protect confidentiality (see the
// banner). Server-safe presentational component; content lives here so it's easy to edit.
interface Beat { k: string; v: string }
interface Engagement {
  id: string;
  sector: string;
  role: string;
  period: string;
  proves: string;
  beats: Beat[];
}

const ENGAGEMENTS: Engagement[] = [
  {
    id: "payments-genai",
    sector: "Financial services · global card & payments (Fortune 100)",
    role: "Engagement Manager — client-facing delivery lead",
    period: "~2025–present",
    proves: "Governed AI delivery at enterprise scale",
    beats: [
      { k: "Situation", v: "A global payments company ran AI, data, and automation work across six technology portfolios, but delivery was fragmented — inconsistent governance, unclear ROI, and manual effort buried inside finance and technology operations." },
      { k: "My role", v: "Own client-facing technical program delivery and governance across the six portfolios: roadmap alignment, resource and dependency planning, RAID management, executive reporting, and KPI-based governance for AI-enabled workflow automation." },
      { k: "What I did", v: "Stood up KPI governance routines for the automation programs; shaped GenAI and contact-center-AI solutions with business and technology leadership; and led a ~12-person cross-functional pod (ML engineers, business analysts, finance SMEs) to deploy GenAI automation and a cloud contact-center-AI platform across 15+ processes. Scaled the delivery org from roughly a dozen engineers to ~40+ as it proved out." },
      { k: "Key decisions", v: "Prioritized processes by effort-reduction-per-dollar rather than visibility, so the first wins funded the rest; insisted on measurable KPIs before scaling headcount, so the ramp was earned, not assumed." },
      { k: "Outcome", v: "~$3.5M in annual labor-cost avoidance, ~55% reduction in manual effort, and ~35% faster reporting cycles — plus solution-shaping for two enterprise transformation initiatives in the ~$8M+ range (secure data modernization, cloud-aligned platform transformation, digital-payments innovation)." },
    ],
  },
  {
    id: "retail-gono",
    sector: "Convenience retail (Fortune 100)",
    role: "Strategy & PMO Intern (MBA summer)",
    period: "~2024",
    proves: "Analysis that changes an executive decision",
    beats: [
      { k: "Situation", v: "A national convenience-retail chain had paused a ~$130M Food & Beverage modernization program spanning ~7,500 stores, and leadership needed a defensible go/no-go — fast." },
      { k: "My role", v: "Partner with executive leadership to re-model execution timelines and delivery scenarios, surface risk, and inform the restart decision." },
      { k: "What I did", v: "Rebuilt the program's execution timelines and delivery scenarios, stress-testing schedule, cost, and operational risk; ran the financial and delivery analysis that surfaced the exposure hiding in the paused program." },
      { k: "Key decisions", v: "Reframed the question from 'should we restart?' to 'what does pausing actually cost?' — which changed the decision. Chose to quantify sunk commitments rather than re-litigate strategy." },
      { k: "Outcome", v: "Uncovered ~$45M in non-cancelable purchase orders that directly informed the go/no-go and enabled an accelerated deployment strategy. Separately supported a ~$500M enterprise cost-optimization initiative with a top-tier strategy firm — building the financial models and tracking initiative execution." },
    ],
  },
  {
    id: "wealth-genai",
    sector: "Wealth & investment management",
    role: "Principal Consultant / Agile Coach",
    period: "~2022–2023",
    proves: "Applied GenAI (RAG + agentic) in a regulated context",
    beats: [
      { k: "Situation", v: "A global wealth-and-investment-management firm needed to modernize AI and cloud platforms while lifting delivery maturity across a large, uneven engineering organization." },
      { k: "My role", v: "Translate business requirements into technical execution across data, engineering, and product; direct two flagship builds; coach the delivery org to maturity; and own engagement governance and commercials for the account." },
      { k: "What I did", v: "Directed a GenAI knowledge platform (LLM + RAG + agentic workflows) to open up institutional knowledge for advisors; led modernization of a portfolio-risk platform integrated with a leading third-party risk engine; and drove Agile maturity across 15+ Scrum teams (~250 professionals), institutionalizing SAFe ceremonies." },
      { k: "Key decisions", v: "Sequenced the knowledge platform ahead of broader modernization because it was the fastest trust-builder with the business; treated delivery-maturity coaching as a deliverable, not a side effect." },
      { k: "Outcome", v: "~10% latency improvement on the risk platform serving 15,000+ professionals; ~25% better sprint predictability and ~20% higher velocity across the org; engagement and commercials run across a ~$3.5M annual engagement." },
    ],
  },
  {
    id: "ml-forecasting",
    sector: "Technology / media / telecom",
    role: "Deputy Manager (Release Train Engineer)",
    period: "~2021–2022",
    proves: "Governing ML delivery like production software",
    beats: [
      { k: "Situation", v: "An ML-powered demand-forecasting platform and a national voice/IVR platform both needed disciplined, multi-team delivery under real business stakes." },
      { k: "My role", v: "Run the Agile Release Train for the forecasting platform — PI planning, model-delivery governance, cross-team coordination across a ~21-member train — and lead delivery for the IVR modernization." },
      { k: "What I did", v: "Translated business goals into prioritized delivery plans, KPI routines, and release milestones for the forecasting solution; coordinated a ~26-member team on the IVR platform; managed executive governance and commercials for a consulting pod." },
      { k: "Key decisions", v: "Put model-delivery governance (eval, release readiness) on the same cadence as feature delivery, so model risk was managed like any other release risk — not bolted on late." },
      { k: "Outcome", v: "The forecasting solution optimized a ~$25M promotional budget and supported ~$350M in Q4 business impact; the IVR platform (serving ~1,250 locations and 140M+ customers) improved CSAT ~18% while cutting wait times ~25%; the pod delivered on time with full billing realization across a ~$5.5M engagement." },
    ],
  },
  {
    id: "capital-markets",
    sector: "Financial data & analytics / capital markets",
    role: "Project Manager (Scrum Master)",
    period: "~2020–2021",
    proves: "Delivery governance for a distributed, regulated program",
    beats: [
      { k: "Situation", v: "Phase 1 of a modernized capital-markets platform required coordinating a large cross-functional team across the U.S., U.K., and India through a complex transformation with heavy security and release-governance requirements." },
      { k: "My role", v: "Lead Agile delivery and PMO governance for a ~50-member team; standardize reporting and RAID governance; and own InfoSec, release, and production-readiness governance end to end." },
      { k: "What I did", v: "Ran a Jira migration and delivery-dashboard modernization across 7 Scrum teams — standardizing sprint reporting, OKR tracking, dependency visibility — and managed security and production-readiness governance across 45+ releases with CTO/CISO stakeholders." },
      { k: "Key decisions", v: "Invested early in reporting/RAID standardization even though it slowed the first sprints — it paid back in dependency visibility and reduced reporting overhead for the rest of the program." },
      { k: "Outcome", v: "~20% higher delivery velocity and capacity, ~$10K/week in savings, ~25% faster turnaround, ~15 hours/week of reporting overhead removed, and 100% security/compliance sign-off across 45+ releases." },
    ],
  },
  {
    id: "healthcare-modernization",
    sector: "Healthcare payer / pharmacy benefits",
    role: "Project Manager (Technology Consulting)",
    period: "~2018–2019",
    proves: "Delivery leadership under real regulatory constraints",
    beats: [
      { k: "Situation", v: "Two enterprise healthcare-modernization programs — a regional health insurer's platform and a national pharmacy-benefits platform — had to move in a highly regulated environment with many senior stakeholders." },
      { k: "My role", v: "Lead delivery coordination and stakeholder governance across both programs, aligning 45+ senior stakeholders and 30+ technical resources." },
      { k: "What I did", v: "Facilitated Agile delivery across 3 Scrum teams; oversaw implementation of a claims-pricing engine (serving 9,000+ locations) and a large pharmacy-benefits platform (serving ~60,000+ pharmacies); governed production-release readiness across both." },
      { k: "Key decisions", v: "In a regulated, multi-stakeholder setting, prioritized release-readiness governance and dependency clarity over raw velocity — the cost of a bad release was far higher than the cost of a careful one." },
      { k: "Outcome", v: "On-cadence delivery across both regulated programs with production-release governance that held, aligning dozens of senior stakeholders across business and technical teams." },
    ],
  },
];

const EARLY: { title: string; body: string }[] = [
  { title: "Founder-Director, EdTech venture (~2019–2020)", body: "Bootstrapped a data-driven education-coaching venture: personalized guidance to 700+ students, a proprietary psychometric assessment framework, partnerships with 180+ universities, and a SaaS prototype. Ran the sell-side M&A end to end, executing a strategic sale (figure adjusted: low-six-figures, ~3× EBITDA) that financed my MBA. Demonstrates 0→1 product, a data-driven method, and a real commercial exit." },
  { title: "Senior Architect / Construction Manager, design & real-estate tech (~2013–2016)", body: "Delivered high-spec commercial facilities (including a data center and a print-press plant), managing 60+ contractors against multi-million-dollar budgets. Pioneered a technology-first construction method — pre-integrating building automation, MEP, IT, and IoT — that cut post-construction rework ~35% and won repeat Fortune 500 engagements. Demonstrates complex program delivery and a technology-forward instinct, years before it was fashionable." },
];

export function Engagements() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slatey-400 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Portfolio</Link>
          <span className="ml-1 font-mono text-xs text-slatey-500">Engagements</span>
        </div>
      </header>

      <section className="text-white" style={{ background: "radial-gradient(1100px 600px at 72% 30%, #1d3a5c 0%, #152433 55%, #0e1923 100%)" }}>
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-5 md:py-16">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Real engagements · anonymized</p>
          <h1 className="mt-4 max-w-3xl text-[1.6rem] font-bold leading-[1.15] tracking-tight md:text-4xl">The work behind the labs, as walk-through case studies.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-300">The labs show how I think; these show what I have actually delivered — ten-plus years of enterprise AI, cloud, and platform programs across financial services, retail, and telecom.</p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-5">
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Client names are abstracted to sector descriptors and every figure is directionally representative and adjusted to protect confidentiality — the numbers convey the shape and scale of the work, not exact contract values. Specifics available under NDA.</span>
        </div>

        <div className="space-y-5">
          {ENGAGEMENTS.map((e) => (
            <article key={e.id} className="rounded-xl border border-line bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-ink">{e.sector}</h2>
                  <p className="mt-0.5 text-xs text-slatey-500">{e.role} · {e.period}</p>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">{e.proves}</span>
              </div>
              <div className="mt-3 space-y-2.5 border-t border-line pt-3">
                {e.beats.map((b) => (
                  <div key={b.k} className="grid gap-1 sm:grid-cols-[130px_1fr]">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{b.k}</p>
                    <p className="text-sm leading-relaxed text-slatey-300">{b.v}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <p className="stat-label mb-3">Earlier career · range</p>
          <div className="grid gap-4 md:grid-cols-2">
            {EARLY.map((e) => (
              <div key={e.title} className="rounded-xl border border-line bg-white p-4 shadow-card">
                <h3 className="text-sm font-semibold text-ink">{e.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slatey-400">{e.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-sm text-slatey-400">
          <a href="mailto:sudeeplalka@gmail.com" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"><Mail className="h-4 w-4" /> Discussing a role? Happy to walk through any of these under NDA.</a>
        </div>
      </main>
    </div>
  );
}
