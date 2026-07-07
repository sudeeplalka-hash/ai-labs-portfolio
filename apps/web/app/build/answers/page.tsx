import { MessageSquareText, GitCompare, AlertTriangle, ShieldCheck } from "lucide-react";
import { PageIntro } from "@rag/components/common/PageIntro";
import { DataSourceToggle } from "@rag/components/live-views/DataSourceToggle";
import { LiveAnswerQuality } from "@rag/components/live-views/LiveAnswerQuality";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { StatusBadge, RiskBadge } from "@rag/components/common/Badge";
import { ScoreBar } from "@rag/components/common/ScoreBar";
import { ClaimVerificationPanel } from "@rag/components/claims/ClaimVerificationPanel";
import { answerMetrics, answerFailureExamples, answerComparison } from "@rag/data/answerQuality";
import { queryTraces } from "@rag/data/queryTraces";

function AnswersDemo() {
  const claimTrace = queryTraces.find((t) => t.id === "trace-05")!;

  return (
    <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {answerMetrics.map((m) => {
          const lower = m.id === "hallucination";
          return (
            <div key={m.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="stat-label">{m.label}</span>
                <StatusBadge status={m.status} />
              </div>
              <p className="mt-1 text-2xl font-semibold text-ink">{m.value}%</p>
              <div className="mt-2">
                <ScoreBar value={m.value} target={m.target} mode={lower ? "lower-better" : "higher-better"} showValue={false} />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slatey-500">{m.interpretation}</p>
            </div>
          );
        })}
      </div>

      <Panel>
        <SectionHeader title="Baseline vs Improved Answer" description={answerComparison.question} icon={GitCompare} />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.05] p-4">
            <p className="mb-2 text-xs font-semibold text-rose-700">{answerComparison.baseline.label}</p>
            <p className="text-sm leading-relaxed text-slatey-300">{answerComparison.baseline.answer}</p>
            <div className="mt-3 space-y-2">
              <LabeledBar label="Faithfulness" value={answerComparison.baseline.faithfulness} />
              <LabeledBar label="Citation Accuracy" value={answerComparison.baseline.citationAccuracy} />
            </div>
            <p className="mt-3 text-[11px] text-slatey-400">{answerComparison.baseline.note}</p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <p className="mb-2 text-xs font-semibold text-emerald-700">{answerComparison.improved.label}</p>
            <p className="text-sm leading-relaxed text-slatey-300">{answerComparison.improved.answer}</p>
            <div className="mt-3 space-y-2">
              <LabeledBar label="Faithfulness" value={answerComparison.improved.faithfulness} />
              <LabeledBar label="Citation Accuracy" value={answerComparison.improved.citationAccuracy} />
            </div>
            <p className="mt-3 text-[11px] text-slatey-400">{answerComparison.improved.note}</p>
          </div>
        </div>
      </Panel>

      <Panel>
        <SectionHeader title="Claim Level Verification (Example)" description={claimTrace.question} icon={ShieldCheck} />
        <ClaimVerificationPanel claims={claimTrace.claimVerifications} />
      </Panel>

      <Panel>
        <SectionHeader title="Answer Failure Examples" description="Subtle failures that answer level scoring alone would miss." icon={AlertTriangle} />
        <div className="grid gap-4 lg:grid-cols-2">
          {answerFailureExamples.map((ex) => (
            <div key={ex.id} className="rounded-lg border border-line bg-navy-850/50 p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{ex.title}</h3>
                <RiskBadge level={ex.riskLevel} />
              </div>
              <p className="text-[11px] uppercase tracking-wider text-slatey-500">{ex.failureMode}</p>
              <p className="mt-2 text-xs text-slatey-400"><span className="text-slatey-500">Q:</span> {ex.question}</p>
              <p className="mt-1 text-xs italic text-slatey-300">&ldquo;{ex.generatedAnswer}&rdquo;</p>
              <p className="mt-2 text-xs leading-relaxed text-rose-700/90"><span className="font-medium">What went wrong: </span>{ex.whatWentWrong}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-emerald-700/90"><span className="font-medium">Expected: </span>{ex.expectedBehavior}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function LabeledBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-slatey-400">
        <span>{label}</span>
        <span className="font-medium text-slatey-300">{value}%</span>
      </div>
      <ScoreBar value={value} target={85} showValue={false} />
    </div>
  );
}

export const metadata = { title: "Answer Quality" };

export default function AnswersPage() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Answer Quality" title="Is the answer faithful, complete, and correctly cited?">
        Strong retrieval does not guarantee a trustworthy answer. These metrics measure whether the generated response stays grounded
        in the evidence, covers what was asked, cites accurately, and escalates when it should.
      </PageIntro>
      <DataSourceToggle demo={<AnswersDemo />} live={<LiveAnswerQuality />} />
    </div>
  );
}
