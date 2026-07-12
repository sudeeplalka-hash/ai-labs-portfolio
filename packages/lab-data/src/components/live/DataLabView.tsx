"use client";

import { useCallback, useRef, useState } from "react";
import {
  UploadCloud,
  FileUp,
  Sparkles,
  RotateCcw,
  ClipboardCheck,
  FileSearch,
  ScanLine,
  Wand2,
  ShieldAlert,
  Scissors,
  Gavel,
  ListChecks,
  CircleCheck,
  AlertTriangle,
  ArrowRightCircle,
  Table2,
  Columns3,
  CircleSlash,
  Copy,
  Type,
  ShieldCheck,
  Send,
  MessageSquareText,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import {
  buildReport,
  computeGate,
  hasUnclearedBlocker,
  PII_PATTERNS,
  redactPii,
  scoreWithFixes,
  DEFAULT_CONFIG,
  type PrepConfig,
} from "@data/lib/prep/engine";
import { RAG_EVALUATOR_URL } from "@data/lib/config";
import { recordSession } from "@data/lib/live/session";
import type { CheckResult, GuidelineId, Level, PrepReport } from "@data/lib/prep/types";
import { RULEBOOK_LIST } from "@data/lib/prep/rulebook";
import { getProfile, type ProfileId } from "@data/lib/prep/profiles";
import { extractTextFromFile, CORPUS_UPLOAD_ACCEPT, FileExtractionError } from "@data/lib/prep/fileExtraction";
import { SAMPLE_CORPUS } from "@data/data/sampleCorpus";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { Badge, type BadgeColor } from "@data/components/common/Badge";
import { InsightCard } from "@data/components/common/InsightCard";
import { ReadinessGauge } from "@data/components/common/ReadinessGauge";
import { MetricTooltip } from "@data/components/common/MetricTooltip";
import { PrepTimeline } from "./PrepTimeline";
import { ChunkReadiness } from "./ChunkReadiness";
import { ColumnProfiler } from "./ColumnProfiler";
import { RuleProfileSelector } from "./RuleProfileSelector";
import { ConsequenceSimulator } from "./ConsequenceSimulator";
import { ExportReport } from "./ExportReport";
import { ThresholdControls } from "./ThresholdControls";
import { BeforeAfterDiff } from "./BeforeAfterDiff";
import { cn } from "@data/lib/cn";

const STEPS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "ingest", label: "Ingest & decode", icon: FileSearch },
  { key: "profile", label: "Profile structure", icon: ScanLine },
  { key: "clean", label: "Clean & normalize", icon: Wand2 },
  { key: "guidelines", label: "Apply org guidelines", icon: ShieldCheck },
  { key: "pii", label: "Clear sensitive data", icon: ShieldAlert },
  { key: "chunk", label: "Chunk-readiness", icon: Scissors },
  { key: "gate", label: "Score & gate", icon: Gavel },
];

const LEVEL_BADGE: Record<Level, { color: BadgeColor; word: string; icon: LucideIcon; hex: string }> = {
  healthy: { color: "emerald", word: "Pass", icon: CircleCheck, hex: "#16a34a" },
  watch: { color: "amber", word: "Watch", icon: AlertTriangle, hex: "#d97706" },
  risk: { color: "orange", word: "At risk", icon: AlertTriangle, hex: "#ea580c" },
  critical: { color: "rose", word: "Blocker", icon: ShieldAlert, hex: "#dc2626" },
};

// Solid gate bars — decorative fill, keeps the vivid tone (3:1 non-text is the bar).
const GATE_BG: Record<string, string> = {
  emerald: "bg-status-healthy-fill",
  amber: "bg-status-watch-fill",
  orange: "bg-status-risk-fill",
  rose: "bg-status-critical-fill",
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function DataLabView() {
  const [report, setReport] = useState<PrepReport | null>(null);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [handed, setHanded] = useState(false);
  const [source, setSource] = useState<{ name: string; text: string; size: number } | null>(null);
  const [sampleId, setSampleId] = useState<string | undefined>(undefined);
  const [profileId, setProfileId] = useState<ProfileId>("general");
  const [config, setConfig] = useState<PrepConfig>(DEFAULT_CONFIG);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const runPipeline = useCallback(
    async (name: string, text: string, size: number, sId: string | undefined) => {
      setRunning(true);
      setReport(null);
      setHanded(false);
      setApplied(new Set());
      setSource({ name, text, size });
      setSampleId(sId);
      for (let i = 0; i < STEPS.length; i++) {
        setStepIndex(i);
        await delay(360);
      }
      const r = buildReport(name, text, size, profileId, config);
      setReport(r);
      setRunning(false);
      const g = computeGate(r.baseScore, hasUnclearedBlocker(r.checks, new Set()));
      recordSession({
        name: r.fileName,
        kind: r.kind,
        source: "single",
        profileId,
        score: r.baseScore,
        gate: g.gate,
        piiHits: r.pii.reduce((a, b) => a + b.count, 0),
        chunks: r.chunk.count,
        estTokens: r.chunk.estTokens,
        rows: r.profile.kind === "tabular" ? r.profile.rows : undefined,
        dups: r.profile.kind === "tabular" ? r.profile.dups : undefined,
        missingPct: r.profile.kind === "tabular" ? Math.round(r.profile.missingPct) : undefined,
      });
    },
    [profileId, config],
  );

  const onFile = useCallback(
    (file: File) => {
      setParseError(null);
      // PDF/DOCX are parsed to text in-browser; other types are read as text.
      void extractTextFromFile(file)
        .then((t) => runPipeline(file.name, t, file.size, undefined))
        .catch((err) =>
          setParseError(err instanceof FileExtractionError ? err.message : `Couldn't read "${file.name}".`),
        );
    },
    [runPipeline],
  );

  const loadSample = (id: string) => {
    const s = SAMPLE_CORPUS.find((x) => x.id === id);
    if (s) void runPipeline(s.name, s.content, s.content.length, s.id);
  };

  const changeProfile = (id: ProfileId) => {
    setProfileId(id);
    setApplied(new Set());
    setHanded(false);
    if (source) setReport(buildReport(source.name, source.text, source.size, id, config));
  };

  const changeConfig = (c: PrepConfig) => {
    setConfig(c);
    setApplied(new Set());
    setHanded(false);
    if (source) setReport(buildReport(source.name, source.text, source.size, profileId, c));
  };

  const reset = () => {
    setReport(null);
    setRunning(false);
    setApplied(new Set());
    setHanded(false);
    setSource(null);
    setSampleId(undefined);
    setConfig(DEFAULT_CONFIG);
    if (inputRef.current) inputRef.current.value = "";
  };

  const toggleFix = (id: string) =>
    setApplied((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ---- derived ----
  const score = report ? scoreWithFixes(report.checks, applied) : 0;
  const blocker = report ? hasUnclearedBlocker(report.checks, applied) : false;
  const gate = report ? computeGate(score, blocker) : null;
  const piiRedacted = applied.has("pii");
  const profileName = getProfile(profileId).name;
  const cleared = !!gate && (gate.gate === "Approved" || gate.gate === "Conditional");
  const approved = !!gate && gate.gate === "Approved";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT: intake + timeline, sticky so the controls travel with the long
          report instead of leaving a tall empty gutter on scroll. */}
      <div className="space-y-6 lg:sticky lg:top-24 lg:col-span-1 lg:self-start">
        <Panel>
          <SectionHeader title="Upload a file" description="CSV · JSON · TXT · MD · PDF · DOCX, runs in your browser" icon={UploadCloud} />
          <label
            htmlFor="fileInput"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) onFile(f);
            }}
            className={cn(
              "block cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragOver ? "border-primary bg-primary-soft" : "border-line bg-slate-50/60 hover:bg-slate-50",
            )}
          >
            <FileUp className="mx-auto h-7 w-7 text-slatey-400" />
            <div className="mt-2 text-sm font-medium text-ink">
              Drop a file or <span className="text-primary">browse</span>
            </div>
            <div className="mt-0.5 text-xs text-slatey-400">CSV · JSON · TXT · MD · PDF · DOCX, nothing leaves this tab</div>
            <input
              ref={inputRef}
              id="fileInput"
              type="file"
              accept={CORPUS_UPLOAD_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>

          {parseError && (
            <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-status-risk/30 bg-status-risk/[0.06] p-2.5 text-[11px] leading-relaxed text-status-risk">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{parseError}</span>
            </div>
          )}

          {/* Sample switcher, only after a report exists. In the empty state the
              richer sample grid in EmptyHero is the single source, so samples
              don't appear in two places at once. */}
          {(report || running) && (
            <div className="mt-4">
              <div className="stat-label mb-2">Switch sample</div>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_CORPUS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSample(s.id)}
                    className="group rounded-lg border border-line bg-white p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-ink">{s.label}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slatey-400">{s.blurb}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(report || running) && (
            <button
              onClick={reset}
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slatey-300 hover:text-slatey-100"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </Panel>

        {(running || report) && (
          <Panel>
            <div className="stat-label mb-3">Preparation pipeline</div>
            <PrepTimeline steps={STEPS} activeIndex={stepIndex} done={!!report} />
            {running && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs text-primary-dark">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Working through the org rulebook…
              </div>
            )}
          </Panel>
        )}
      </div>

      {/* RIGHT: results */}
      <div className="space-y-6 lg:col-span-2">
        {!report && !running && <EmptyHero onPick={loadSample} />}

        {running && <RunningSkeleton />}

        {report && gate && (
          <>
            {/* Verdict + gauge */}
            <div className="panel overflow-hidden">
              <div className={cn("h-1.5 w-full", GATE_BG[gate.color])} />
              {approved && (
                <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50/70 px-5 py-2 text-sm font-medium text-emerald-700">
                  <CircleCheck className="h-4 w-4" /> Cleared the ingestion gate, ready to hand off to the RAG Evaluator.
                </div>
              )}
              <div className="grid gap-5 p-5 md:grid-cols-2">
                <ReadinessGauge value={score} color={gate.color} />
                <div className="flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="stat-label">Ingestion gate</span>
                    <Badge color={gate.color}>{gate.gate}</Badge>
                    <Badge color={gate.color}>{gate.verdict}</Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-slatey-200">{gate.summary}</p>
                  <div className="mt-1 font-mono text-[11px] text-slatey-400">
                    {report.fileName} · {report.sizeKB < 1024 ? `${report.sizeKB.toFixed(0)} KB` : `${(report.sizeKB / 1024).toFixed(1)} MB`} ·{" "}
                    {report.ext.toUpperCase()} · {profileName}
                  </div>
                  <div className="mt-2">
                    <ExportReport report={report} score={score} gate={gate} profileName={profileName} applied={applied} />
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance profile */}
            <Panel>
              <SectionHeader title="Compliance profile" description="Judge this file against an industry's bar, escalates the rules that matter" icon={SlidersHorizontal} />
              <RuleProfileSelector value={profileId} onChange={changeProfile} />
            </Panel>

            {/* Editable thresholds */}
            <Panel>
              <SectionHeader title="Rule thresholds" description="Tune the org policy and re score the file live" icon={SlidersHorizontal} />
              <ThresholdControls config={config} onChange={changeConfig} />
            </Panel>

            {/* Consequence simulator */}
            <Panel>
              <SectionHeader title="What would the AI answer?" description="The same file ingested as is vs prepared, the failure prep prevents" icon={MessageSquareText} />
              <ConsequenceSimulator report={report} sampleId={sampleId} cleared={cleared} />
            </Panel>

            {/* KPIs */}
            <KpiStrip report={report} />

            {/* Fix-it loop */}
            <Panel>
              <SectionHeader
                title="Fix it & clear the gate"
                description="Apply each remediation and watch the readiness score climb"
                icon={Wand2}
              />
              <FixItList report={report} applied={applied} onToggle={toggleFix} />
            </Panel>

            {/* Before / after */}
            <Panel>
              <SectionHeader title="Before / after" description="What the fixes you apply change about the data" icon={Wand2} />
              <BeforeAfterDiff report={report} applied={applied} />
            </Panel>

            {/* Org rulebook */}
            <Panel>
              <SectionHeader
                title="Org guideline rulebook"
                description="Every file is scored against the organization's ingestion guidelines"
                icon={ListChecks}
              />
              <Rulebook checks={report.checks} applied={applied} />
            </Panel>

            {/* PII */}
            {report.pii.length > 0 && (
              <Panel>
                <SectionHeader
                  title="Sensitive data clearance"
                  description="Anything embedded becomes retrievable by the AI, clear it first"
                  icon={ShieldAlert}
                  action={
                    <button
                      onClick={() => toggleFix("pii")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        piiRedacted
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                          : "bg-primary text-white shadow-glow hover:bg-primary-dark",
                      )}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {piiRedacted ? "Redacted ✓" : "Redact all PII"}
                    </button>
                  }
                />
                {/* what tripped the scan, by category */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {report.pii.map((p) => (
                    <span
                      key={p.type}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                        p.severe ? "bg-rose-50 text-rose-700 ring-rose-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20",
                      )}
                      title={p.severe ? "Hard blocker until cleared" : "Sensitive, review before ingestion"}
                    >
                      {p.label} <span className="font-mono">×{p.count}</span>
                    </span>
                  ))}
                </div>
                <PiiPreview serialized={report.serialized} redacted={piiRedacted} />
              </Panel>
            )}

            {/* Column profiler (tabular) */}
            {report.profile.kind === "tabular" && (
              <Panel>
                <SectionHeader title="Column profiler" description="Click a column to inspect type, missingness, and samples" icon={Columns3} />
                <ColumnProfiler columns={report.profile.columns} />
              </Panel>
            )}

            {/* Chunk readiness */}
            <Panel>
              <SectionHeader
                title="Chunk readiness preview"
                description="Can this be cleanly segmented for embedding? (Drag to explore, not retrieval tuning)"
                icon={Scissors}
              />
              <ChunkReadiness serialized={report.serialized} />
            </Panel>

            {/* Handoff */}
            <Panel>
              <SectionHeader title="Hand off to the RAG Evaluator" description="What this file becomes once it clears the gate" icon={Send} />
              <Handoff report={report} gate={gate} applied={applied} handed={handed} onHand={() => setHanded(true)} />
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------

function EmptyHero({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="panel p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
        <ClipboardCheck className="h-6 w-6" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-ink">No file analyzed yet</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-slatey-300">
        Upload a file, or pick a sample below to see the full readiness report: org-guideline checks, PII clearance,
        a chunk-readiness preview, and the ingestion gate.
      </p>

      <div className="mt-5 flex items-center gap-2">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slatey-400">Try a sample</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-4 grid gap-2.5 text-left sm:grid-cols-2">
        {SAMPLE_CORPUS.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s.id)}
            className="group flex items-start gap-2.5 rounded-lg border border-line bg-white p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
          >
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink group-hover:text-primary-dark">{s.label}</span>
              <span className="block text-xs leading-snug text-slatey-400">{s.blurb}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="mx-auto mt-4 max-w-md text-[11px] leading-relaxed text-slatey-400">
        Tip: load a sensitive sample, then switch the compliance profile (HIPAA, PCI DSS, GDPR) to watch the gate
        tighten.
      </p>
    </div>
  );
}

function RunningSkeleton() {
  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel p-4">
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiStrip({ report }: { report: PrepReport }) {
  const items: { label: string; value: string; sub: string; color: BadgeColor; icon: LucideIcon }[] = [];
  if (report.profile.kind === "tabular") {
    const p = report.profile;
    items.push({ label: "Rows", value: p.rows.toLocaleString(), sub: "records", color: "blue", icon: Table2 });
    items.push({ label: "Columns", value: String(p.cols), sub: "fields", color: "blue", icon: Columns3 });
    items.push({
      label: "Missing cells",
      value: `${Math.round(p.missingPct)}%`,
      sub: p.missingPct < 2 ? "in tolerance" : "needs attention",
      color: p.missingPct < 2 ? "emerald" : p.missingPct > 15 ? "orange" : "amber",
      icon: CircleSlash,
    });
    items.push({
      label: "Duplicates",
      value: p.dups.toLocaleString(),
      sub: p.dups === 0 ? "none" : "to dedupe",
      color: p.dups === 0 ? "emerald" : "amber",
      icon: Copy,
    });
  } else {
    const p = report.profile;
    items.push({ label: "Words", value: p.words.toLocaleString(), sub: "in document", color: "blue", icon: Type });
    items.push({ label: "Blocks", value: (p.paras || p.lines).toLocaleString(), sub: "paragraphs", color: "blue", icon: ListChecks });
    items.push({ label: "Repeated lines", value: String(p.repeatedLines), sub: p.repeatedLines ? "boilerplate" : "clean", color: p.repeatedLines ? "amber" : "emerald", icon: Copy });
  }
  const piiTotal = report.pii.reduce((a, b) => a + b.count, 0);
  items.push({
    label: "PII hits",
    value: piiTotal.toLocaleString(),
    sub: piiTotal === 0 ? "none found" : "to clear",
    color: piiTotal === 0 ? "emerald" : "rose",
    icon: ShieldAlert,
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.slice(0, 4).map((k) => (
        <div key={k.label} className="panel panel-hover p-4">
          <div className="flex items-center justify-between">
            <span className="stat-label">{k.label}</span>
            <k.icon className="h-4 w-4 text-slatey-400" />
          </div>
          <div className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">{k.value}</div>
          <div className="mt-1">
            <Badge color={k.color}>{k.sub}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function FixItList({
  report,
  applied,
  onToggle,
}: {
  report: PrepReport;
  applied: Set<string>;
  onToggle: (id: string) => void;
}) {
  const fixable = report.checks.filter((c) => c.fix);
  const clean = report.checks.filter((c) => !c.fix);
  if (fixable.length === 0) {
    return <p className="text-sm text-slatey-300">No remediations needed, every guideline passed.</p>;
  }
  return (
    <div className="space-y-2.5">
      {fixable.map((c) => {
        const lvl = LEVEL_BADGE[c.level];
        const done = !!c.fix && applied.has(c.fix.id);
        return (
          <div
            key={c.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 transition-colors",
              done ? "border-emerald-200 bg-emerald-50/50" : "border-line bg-white",
            )}
          >
            <lvl.icon className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: done ? "#16a34a" : lvl.hex }} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink">{c.name}</span>
                {done ? <Badge color="emerald">Resolved</Badge> : <Badge color={lvl.color}>{lvl.word}</Badge>}
              </div>
              <div className="mt-0.5 text-[13px] text-slatey-200">{c.detail}</div>
              <div className="mt-1 text-[11px] italic text-slatey-400">Downstream: {c.downstream}</div>
            </div>
            <button
              onClick={() => c.fix && onToggle(c.fix.id)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                done
                  ? "bg-slate-100 text-slatey-300 hover:bg-slate-200"
                  : "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25 hover:bg-primary/15",
              )}
            >
              {done ? "Undo" : `Apply +${c.fix?.delta ?? 0}`}
            </button>
          </div>
        );
      })}
      {clean.length > 0 && (
        <div className="pt-1">
          <div className="stat-label mb-1.5">Passed automatically</div>
          <div className="flex flex-wrap gap-1.5">
            {clean.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <CircleCheck className="h-3 w-3" /> {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function worstLevel(levels: Level[]): Level {
  const order: Level[] = ["healthy", "watch", "risk", "critical"];
  return levels.reduce<Level>((w, l) => (order.indexOf(l) > order.indexOf(w) ? l : w), "healthy");
}

function Rulebook({ checks, applied }: { checks: CheckResult[]; applied: Set<string> }) {
  const statusFor = (gid: GuidelineId): Level => {
    const relevant = checks.filter((c) => c.guideline === gid && !(c.fix && applied.has(c.fix.id)));
    if (relevant.length === 0) return "healthy";
    return worstLevel(relevant.map((c) => c.level));
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {RULEBOOK_LIST.map((g) => {
        const lvl = statusFor(g.id);
        const b = LEVEL_BADGE[lvl];
        return (
          <div key={g.id} className="rounded-lg border border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                {g.name}
                <MetricTooltip text={`${g.rule}, ${g.downstream}`} />
              </span>
              <Badge color={b.color}>{b.word}</Badge>
            </div>
            <div className="mt-1 text-[12px] leading-snug text-slatey-300">{g.rule}</div>
          </div>
        );
      })}
    </div>
  );
}

function escapeRanges(text: string) {
  type R = { start: number; end: number; severe: boolean };
  const ranges: R[] = [];
  for (const p of PII_PATTERNS) {
    const re = new RegExp(p.re.source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length, severe: p.severe });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: R[] = [];
  let lastEnd = -1;
  for (const r of ranges) {
    if (r.start >= lastEnd) {
      merged.push(r);
      lastEnd = r.end;
    }
  }
  return merged;
}

function PiiPreview({ serialized, redacted }: { serialized: string; redacted: boolean }) {
  const text = (redacted ? redactPii(serialized) : serialized).slice(0, 1600);
  let nodes: React.ReactNode[];
  if (redacted) {
    nodes = [text];
  } else {
    const ranges = escapeRanges(text);
    nodes = [];
    let cursor = 0;
    ranges.forEach((r, i) => {
      if (r.start > cursor) nodes.push(text.slice(cursor, r.start));
      nodes.push(
        <mark
          key={i}
          className={cn(
            "rounded px-0.5",
            r.severe ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800",
          )}
        >
          {text.slice(r.start, r.end)}
        </mark>,
      );
      cursor = r.end;
    });
    if (cursor < text.length) nodes.push(text.slice(cursor));
  }
  return (
    <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slatey-100">
      {nodes}
    </pre>
  );
}

function Handoff({
  report,
  gate,
  applied,
  handed,
  onHand,
}: {
  report: PrepReport;
  gate: NonNullable<ReturnType<typeof computeGate>>;
  applied: Set<string>;
  handed: boolean;
  onHand: () => void;
}) {
  const cleared = (id: string) => applied.has(id);
  const manifest = [
    { label: "Approved chunks", value: report.chunk.count.toLocaleString(), ok: true },
    { label: "Est. embedding tokens", value: report.chunk.estTokens.toLocaleString(), ok: true },
    { label: "PII cleared", value: report.pii.length === 0 ? "n/a" : cleared("pii") ? "yes" : "no", ok: report.pii.length === 0 || cleared("pii") },
    { label: "Provenance signed", value: cleared("provenance") ? "yes" : "pending", ok: cleared("provenance") },
    { label: "Metadata tagged", value: cleared("taxonomy") ? "yes" : "pending", ok: cleared("taxonomy") },
  ];
  const canSend = gate.gate === "Approved" || gate.gate === "Conditional";
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {manifest.map((m) => (
          <div key={m.label} className="rounded-lg border border-line bg-slate-50 p-3">
            <div className="stat-label">{m.label}</div>
            <div className={cn("mt-1 text-sm font-semibold", m.ok ? "text-ink" : "text-status-watch")}>{m.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          disabled={!canSend || handed}
          onClick={() => {
            onHand();
            window.open(RAG_EVALUATOR_URL, "_blank", "noopener");
          }}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            !canSend
              ? "cursor-not-allowed bg-slate-100 text-slatey-400"
              : handed
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                : "bg-primary text-white shadow-glow hover:bg-primary-dark",
          )}
        >
          {handed ? <ArrowRightCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          {handed ? "Handed off to RAG Evaluator" : "Send to RAG Evaluator"}
        </button>
        {!canSend && <span className="text-xs text-slatey-400">Clear the gate first, resolve blockers and at risk items.</span>}
      </div>
      {handed && (
        <div className="mt-3">
          <InsightCard title="Handed off" tone="success" icon={ArrowRightCircle}>
            Opening the RAG Evaluator in a new tab, this prepared file is now its input. In the suite, the Data Lab
            prevents the very failures the RAG Evaluator detects: stale duplicates, PII leaks, and conflicting sources
            never reach the index.
          </InsightCard>
        </div>
      )}
    </div>
  );
}
