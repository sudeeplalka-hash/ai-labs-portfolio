import {
  FileSearch,
  ScanLine,
  Wand2,
  ShieldCheck,
  ShieldAlert,
  Scissors,
  Gavel,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { PageIntro } from "@data/components/common/PageIntro";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { Badge } from "@data/components/common/Badge";
import { RULEBOOK_LIST } from "@data/lib/prep/rulebook";

export const metadata = { title: "Prep & Guidelines Guide" };

const STEPS = [
  { n: "1", icon: FileSearch, title: "Ingest & decode", body: "Open the file safely and confirm it is readable UTF-8. Corrupt encodings, binary blobs, and unparseable JSON are caught before they poison anything downstream.", why: "Garbage in means garbage embeddings — and silent retrieval failures later." },
  { n: "2", icon: ScanLine, title: "Profile the structure", body: "Detect rows/columns or document blocks, infer column types, count distinct values and nulls. This is the map the rest of the pipeline navigates by.", why: "You can't clean what you haven't measured." },
  { n: "3", icon: Wand2, title: "Clean & normalize", body: "Drop empty and duplicate rows, fix inconsistent dates and casing, resolve missing values, and strip dead columns and boilerplate.", why: "Duplicates skew retrieval; boilerplate wastes tokens; inconsistency confuses the model." },
  { n: "4", icon: ShieldCheck, title: "Apply org guidelines", body: "Enforce the rulebook: admissibility, freshness/versioning, provenance and licensing, and required taxonomy/metadata tags.", why: "This is where a stale Policy v2.7 gets quarantined before it can contradict v3.1 in answers." },
  { n: "5", icon: ShieldAlert, title: "Clear sensitive data", body: "Scan for emails, phones, SSNs, cards and IPs. Redact, mask, or escalate for sign-off before anything is embedded.", why: "Anything embedded becomes retrievable — PII leaks are a one-way door." },
  { n: "6", icon: Scissors, title: "Chunk-readiness & gate", body: "Confirm the content segments cleanly within the embedding band, then roll everything into a readiness score and an explicit gate. A human owner signs off.", why: "An honest gate keeps the knowledge base — and every answer built on it — trustworthy." },
];

const GATE = [
  { title: "Quality", color: "emerald" as const, d: "Dedup, completeness & format thresholds met" },
  { title: "Privacy", color: "blue" as const, d: "PII redacted or explicitly approved" },
  { title: "Provenance", color: "violet" as const, d: "Source & license verified by an owner" },
  { title: "Chunking", color: "cyan" as const, d: "Chunk sizes within the embedding target band" },
];

export default function Page() {
  return (
    <div>
      <PageIntro eyebrow="Reference" title="Prep & Guidelines Guide">
        Raw files are rarely safe to embed as-is. This is the standard path every file walks before it earns a place
        in the vector database — and why each step matters once the RAG Evaluator starts answering from it.
      </PageIntro>

      <div className="grid gap-6 lg:grid-cols-2">
        {STEPS.map((s) => (
          <div key={s.n} className="panel panel-hover p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <span className="font-mono text-[11px] text-slatey-400">STEP {s.n}</span>
                <h3 className="text-base font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slatey-300">{s.body}</p>
                <p className="mt-2 text-[13px] leading-snug text-primary-dark">{s.why}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Panel className="mt-6">
        <SectionHeader title="The org rulebook" description="Every guideline a file is scored against, and why it matters downstream" icon={BookOpen} />
        <div className="grid gap-3 sm:grid-cols-2">
          {RULEBOOK_LIST.map((g) => (
            <div key={g.id} className="rounded-lg border border-line p-3">
              <div className="text-sm font-semibold text-ink">{g.name}</div>
              <div className="mt-1 text-[13px] leading-snug text-slatey-300">{g.rule}</div>
              <div className="mt-1.5 flex items-start gap-1 text-[12px] text-slatey-400">
                <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span>{g.downstream}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="mt-6">
        <SectionHeader title="The approval gate" description="No file is handed to the RAG Evaluator without clearing all four" icon={ShieldCheck} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GATE.map((g) => (
            <div key={g.title} className="rounded-lg border border-line p-3">
              <div className="flex items-center gap-2">
                <Badge color={g.color}>{g.title}</Badge>
              </div>
              <div className="mt-1.5 text-[13px] leading-snug text-slatey-300">{g.d}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-soft/50 px-4 py-3 text-sm text-primary-dark">
        <Gavel className="h-4 w-4" />
        The Data Lab prevents the failures the RAG Evaluator detects.
      </div>
    </div>
  );
}
