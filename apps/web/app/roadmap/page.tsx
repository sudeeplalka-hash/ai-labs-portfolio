import Link from "next/link";
import { routeMetadata, EXPERIENCE_REVISION } from "@/lib/site";
import { SimulationBoundary } from "@/components/reviewer/Reviewer";

export const metadata = routeMetadata("Product roadmap", "Inspect the working portfolio capabilities, their evidence routes and the integrations still to come.", "/roadmap");

const DELIVERED = [
  { title: "Seven-stage lifecycle and handoffs", detail: "Frame an initiative, inspect data and build evidence, govern a release and revisit realized value.", href: "/lifecycle" },
  { title: "Industry scenarios and provenance", detail: "Explore firsthand and studied scenarios, with source context and direct links to each instrument.", href: "/industries" },
  { title: "Capital allocation and comparison", detail: "Edit a portfolio, constrain the budget and compare funding and recommendation changes against a pinned baseline.", href: "/business/portfolio" },
  { title: "ROI and sensitivity", detail: "Inspect a discounted cash-flow bridge, exact assumptions and the driver that changes the funding case.", href: "/business/roi-builder" },
  { title: "Adoption intervention planning", detail: "Separate current scores from a controlled projection of the steps toward a readiness gate.", href: "/engagement/adoption" },
  { title: "Staffing and mobilization models", detail: "Choose a resolution per skill gap and inspect the modeled cost and delivery consequence.", href: "/engagement/capacity" },
  { title: "Vendor evaluation", detail: "Change decision weights and inspect vendor fit, concentration, renewal and exit exposure.", href: "/business/vendor-monitor" },
  { title: "Governance evidence and exports", detail: "Inspect the modeled evidence loop, findings, controls and governance decisions.", href: "/govern" },
  { title: "EvalBench", detail: "Pressure-test a routing threshold against quality and cost using an authored evaluation dataset.", href: "/builds/eval-bench" },
  { title: "Guided journeys", detail: "Follow a program through related instruments while keeping the narrative and next decision visible.", href: "/storylines" },
];
const NEXT = [
  ["External retrieval adapters", "Connect production vector stores and measure retrieval on an independently maintained evaluation set."],
  ["Durable history across devices", "Add authenticated storage, versioning and permissions beyond browser-local scenarios and exported files."],
  ["Production telemetry and evidence", "Connect monitoring, evaluation stores, model registries and approved enterprise tools."],
  ["Realized benefits tracking", "Reconcile modeled ROI with finance-approved quarterly outcomes and attributable adoption evidence."],
];

export default function Page() {
  return <div className="space-y-8">
    <header><p className="eyebrow">Product roadmap</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">What you can use now, and what needs a real integration</h2><p className="mt-3 max-w-3xl text-base text-slatey-400">Every delivered item opens its working surface. Future integrations describe direction, without promising a delivery date. Experience revision {EXPERIENCE_REVISION}.</p></header>
    <section aria-labelledby="delivered"><h3 id="delivered" className="text-xl font-semibold text-ink">Available in this version</h3><div className="mt-4 grid gap-4 md:grid-cols-2">{DELIVERED.map((item) => <Link key={item.href} href={item.href} className="group rounded-xl border border-line bg-white p-5 shadow-card hover:border-primary"><h4 className="font-semibold text-ink group-hover:text-primary">{item.title} →</h4><p className="mt-2 text-sm leading-relaxed text-slatey-400">{item.detail}</p></Link>)}</div></section>
    <section aria-labelledby="future"><h3 id="future" className="text-xl font-semibold text-ink">Future integrations</h3><div className="mt-4 grid gap-4 md:grid-cols-2">{NEXT.map(([title,detail]) => <article key={title} className="rounded-xl border border-line bg-slate-50 p-5"><h4 className="font-semibold text-ink">{title}</h4><p className="mt-2 text-sm leading-relaxed text-slatey-400">{detail}</p></article>)}</div></section>
    <section className="rounded-xl border border-line bg-white p-5"><h3 className="font-semibold text-ink">Portfolio boundaries</h3><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slatey-400">Confidential client data, cloud provisioning, full model training frameworks and enterprise authentication remain outside this demonstration. Existing scenarios, exports, simulated governance controls and local calculations work without those integrations.</p><Link href="/architecture" className="mt-3 inline-block font-medium text-primary underline">Inspect architecture and handoff contracts</Link></section>
    <SimulationBoundary />
  </div>;
}
