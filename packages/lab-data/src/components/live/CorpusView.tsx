"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Boxes,
  UploadCloud,
  FileUp,
  Sparkles,
  RotateCcw,
  Copy,
  AlertTriangle,
  ShieldAlert,
  CircleCheck,
  Layers,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { analyzeCorpus, type CorpusReport, type DupPair } from "@data/lib/prep/corpus";
import { recomputeCorpus, type FindingStatus } from "@data/lib/prep/findings";
import { deriveDuplicateSets, setIdForPair } from "@data/lib/prep/resolution";
import { DuplicateResolution, type SetResolution } from "./DuplicateResolution";
import { CorpusAtlas3D } from "./CorpusAtlas3D";
import { TopicGroups } from "./TopicGroups";
import { CleaningProof } from "./CleaningProof";
import type { ProofResult } from "@data/lib/prep/proof";
import { RULEBOOK } from "@data/lib/prep/rulebook";
import { FileDown } from "lucide-react";
import type { AtlasHull } from "./CorpusStarMap";
import { ReadinessBoard } from "./ReadinessBoard";
import { RemediationBacklog } from "./RemediationBacklog";
import { getProfile, type ProfileId } from "@data/lib/prep/profiles";
import { extractTextFromFile, CORPUS_UPLOAD_ACCEPT, FileExtractionError } from "@data/lib/prep/fileExtraction";
import { recordSessions, recordCorpusBacklog, recordCorpusExclusions, recordCorpusTopics } from "@data/lib/live/session";
import { CORPUS_SAMPLES } from "@data/data/sampleCorpus";
import { Panel } from "@data/components/common/Panel";
import { SectionHeader } from "@data/components/common/SectionHeader";
import { Badge, type BadgeColor } from "@data/components/common/Badge";
import { RuleProfileSelector } from "./RuleProfileSelector";
import { CorpusStarMap } from "./CorpusStarMap";
import { cn } from "@data/lib/cn";

interface Input {
  name: string;
  text: string;
  size: number;
}

const PAIR_BADGE: Record<DupPair["kind"], { color: BadgeColor; label: string; icon: LucideIcon }> = {
  duplicate: { color: "rose", label: "Duplicate", icon: Copy },
  "stale-version": { color: "amber", label: "Stale version", icon: AlertTriangle },
  "near-duplicate": { color: "slate", label: "Near-duplicate", icon: Layers },
};

const GATE_SEG: { key: "approved" | "conditional" | "hold" | "rejected"; label: string; bg: string }[] = [
  { key: "approved", label: "Approved", bg: "bg-status-healthy" },
  { key: "conditional", label: "Conditional", bg: "bg-status-watch" },
  { key: "hold", label: "Hold", bg: "bg-status-risk" },
  { key: "rejected", label: "Rejected", bg: "bg-status-critical" },
];

export function CorpusView() {
  const [inputs, setInputs] = useState<Input[] | null>(null);
  const [report, setReport] = useState<CorpusReport | null>(null);
  const [profileId, setProfileId] = useState<ProfileId>("general");
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  // Backlog statuses (Phase 1): keyed by finding key, applied through the same
  // engine scoring path as the file view, so Board + gates re-score together.
  const [statuses, setStatuses] = useState<Record<string, FindingStatus>>({});
  // Accepted set resolutions (Phase 2): setId -> chosen keeper (null = keep all).
  const [resolutions, setResolutions] = useState<Record<string, SetResolution>>({});
  const [focusSetId, setFocusSetId] = useState<string | null>(null);
  const [atlasMode, setAtlasMode] = useState<"2d" | "3d">("2d");
  // Confirmed topic labels (Phase 4): topicId -> human-approved label.
  const [topicLabels, setTopicLabels] = useState<Record<string, string>>({});
  const [lastProof, setLastProof] = useState<{ r: ProofResult; preview: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback((ins: Input[], pid: ProfileId) => {
    setRunning(true);
    setInputs(ins);
    setStatuses({});
    setResolutions({});
    setTopicLabels({});
    setLastProof(null);
    setFocusSetId(null);
    // brief async so the loading state paints
    setTimeout(() => {
      const rep = analyzeCorpus(ins, pid);
      setReport(rep);
      setRunning(false);
      recordSessions(
        rep.files.map((f) => ({
          name: f.name,
          kind: f.report.kind,
          source: "corpus" as const,
          profileId: pid,
          score: f.score,
          gate: f.gate.gate,
          piiHits: f.report.pii.reduce((a, b) => a + b.count, 0),
          chunks: f.report.chunk.count,
          estTokens: f.report.chunk.estTokens,
          rows: f.report.profile.kind === "tabular" ? f.report.profile.rows : undefined,
          dups: f.report.profile.kind === "tabular" ? f.report.profile.dups : undefined,
          missingPct: f.report.profile.kind === "tabular" ? Math.round(f.report.profile.missingPct) : undefined,
        })),
      );
    }, 300);
  }, []);

  const loadSampleCorpus = () => {
    const ins = CORPUS_SAMPLES.map((s) => ({ name: s.name, text: s.content, size: s.content.length }));
    setSelectedId(null);
    analyze(ins, profileId);
  };

  const onFiles = (list: FileList) => {
    const arr = Array.from(list);
    setSelectedId(null);
    setParseErrors([]);
    setRunning(true);
    // Extract text from each file (PDF/DOCX parsed in-browser; others read as text).
    // Failures are collected and surfaced rather than aborting the whole batch.
    void Promise.all(
      arr.map((f) =>
        extractTextFromFile(f)
          .then((text) => ({ ok: true as const, input: { name: f.name, text, size: f.size } }))
          .catch((err) => ({
            ok: false as const,
            message: err instanceof FileExtractionError ? err.message : `Couldn't read "${f.name}".`,
          })),
      ),
    ).then((results) => {
      const ins = results.filter((r) => r.ok).map((r) => (r as { input: Input }).input);
      const errs = results.filter((r) => !r.ok).map((r) => (r as { message: string }).message);
      setParseErrors(errs);
      if (ins.length) {
        analyze(ins, profileId);
      } else {
        setRunning(false);
      }
    });
  };

  const changeProfile = (id: ProfileId) => {
    setProfileId(id);
    setStatuses({});
    setResolutions({});
    setTopicLabels({});
    if (inputs) setReport(analyzeCorpus(inputs, id));
  };

  const reset = () => {
    setInputs(null);
    setReport(null);
    setSelectedId(null);
    setParseErrors([]);
    setStatuses({});
    setResolutions({});
    setTopicLabels({});
    setLastProof(null);
    setFocusSetId(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Duplicate/version sets from the base report (stable ids), and the
  // exclusions implied by accepted resolutions.
  const sets = report ? deriveDuplicateSets(report.files, report.pairs) : [];
  const exclusions: Record<string, string> = {};
  for (const [setId, r] of Object.entries(resolutions)) {
    if (r.keepId === null) continue;
    const st = sets.find((x) => x.id === setId);
    if (!st) continue;
    const keepName = st.memberNames[st.memberIds.indexOf(r.keepId)];
    for (const id of st.memberIds) if (id !== r.keepId) exclusions[id] = `Superseded by ${keepName} (duplicate resolution)`;
  }

  // Live view of the corpus with backlog statuses + exclusions applied.
  const adjusted = report ? recomputeCorpus(report, statuses, exclusions) : null;

  // Guided pass state (Phase 5): profile → resolve → hand off.
  const stepProfile = !!report;
  const stepResolve = stepProfile && sets.every((s2) => s2.id in resolutions);
  const stepHandoff = stepResolve && !!adjusted && !adjusted.findings.some((f) => f.status === "open" && f.level === "critical");

  // Proof inputs (Phase 5).
  const excludedNames = new Set(
    Object.keys(exclusions).map((id) => report?.files.find((f) => f.id === id)?.name ?? id),
  );
  const previewExclusions = new Set(
    sets.flatMap((s2) => s2.recommendation.dropIds.map((id) => report?.files.find((f) => f.id === id)?.name ?? id)),
  );
  const topicsByFile = new Map<string, string[]>();
  for (const t of report?.topics ?? []) {
    const label = topicLabels[t.id];
    if (label === undefined) continue;
    for (const n of t.memberNames) topicsByFile.set(n, [...(topicsByFile.get(n) ?? []), label]);
  }

  // Confirmed topics → Atlas hulls (soft palette, deterministic order).
  const HULL_COLORS = ["#0d9488", "#7c3aed", "#b45309", "#0369a1"];
  const hulls: AtlasHull[] = (report?.topics ?? [])
    .filter((t) => topicLabels[t.id] !== undefined)
    .map((t, i) => ({
      label: topicLabels[t.id],
      memberIds: t.memberIds.filter((id) => !(id in exclusions)),
      color: HULL_COLORS[i % HULL_COLORS.length],
    }));

  // Bridge the backlog to the lifecycle (Phase 1): DataSliceWriter reads this
  // snapshot and carries it into ProgramState, where the Data Readiness
  // Handoff turns it into structured remediation entries for Govern.
  useEffect(() => {
    if (!adjusted) return;
    const unresolvedSets = sets
      .filter((s2) => !(s2.id in resolutions))
      .map((s2) => ({
        finding: `${s2.kind === "version" ? "Version conflict" : s2.kind === "duplicate" ? "Duplicate copies" : "Overlapping documents"}: ${s2.memberNames.join(" \u2194 ")}`,
        guideline: "dedup",
        severity: s2.kind === "overlap" ? ("watch" as const) : ("risk" as const),
        recommendation: `Keep ${s2.recommendation.keepName}`,
        status: "open" as const,
      }));
    recordCorpusBacklog([
      ...unresolvedSets,
      ...adjusted.findings.map((f) => ({
        finding: f.name,
        guideline: f.guideline,
        severity: f.level,
        file: f.fileName,
        recommendation: f.fixLabel,
        status: f.status,
      })),
    ]);
    recordCorpusExclusions(
      Object.entries(exclusions).map(([id, reason]) => ({
        file: report?.files.find((f) => f.id === id)?.name ?? id,
        reason,
      })),
    );
    recordCorpusTopics(
      (report?.topics ?? [])
        .filter((t) => topicLabels[t.id] !== undefined)
        .map((t) => ({
          label: topicLabels[t.id],
          files: t.memberNames.filter((_, i2) => !(t.memberIds[i2] in exclusions)),
        })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, statuses, resolutions, topicLabels]);
  const selected = adjusted && selectedId ? adjusted.files.find((f) => f.id === selectedId) : undefined;

  // Readiness dossier (Phase 5): a downloadable markdown record of everything
  // this session decided, provenance-footed, built from the same derived state
  // the panels render (no separate bookkeeping to drift).
  const downloadDossier = () => {
    if (!report || !adjusted) return;
    const lines: string[] = [];
    const push = (x = "") => lines.push(x);
    push("# Corpus Readiness Dossier");
    push();
    push(`Generated ${new Date().toISOString().slice(0, 10)} \u00b7 ${adjusted.activeFiles.length} active file(s), ${adjusted.health.excluded ?? 0} excluded \u00b7 profile: ${profileId}`);
    push();
    push("## Health");
    push(`Average readiness ${adjusted.health.avgScore}/100 \u00b7 ready ${adjusted.health.readyPct}% \u00b7 approved ${adjusted.health.approved} / conditional ${adjusted.health.conditional} / hold ${adjusted.health.hold} / rejected ${adjusted.health.rejected}`);
    push();
    push("## Guideline scores");
    push("| Guideline | Score | Open findings | Files affected |");
    push("|---|---|---|---|");
    for (const r of adjusted.rollups) push(`| ${RULEBOOK[r.guideline].name} | ${r.score}/100 | ${r.findingCount} | ${r.filesAffected} |`);
    push();
    if (Object.keys(resolutions).length) {
      push("## Duplicate & version resolutions");
      for (const [setId, r] of Object.entries(resolutions)) {
        const st = sets.find((x) => x.id === setId);
        if (!st) continue;
        if (r.keepId === null) {
          push(`- Kept all copies: ${st.memberNames.join(" \u2194 ")} (recommendation dismissed)`);
        } else {
          const keep = st.memberNames[st.memberIds.indexOf(r.keepId)];
          const drop = st.memberNames.filter((_, i) => st.memberIds[i] !== r.keepId);
          push(`- Kept **${keep}**, excluded ${drop.join(", ")} (${st.kind})`);
        }
      }
      push();
    }
    const openFindings = adjusted.findings.filter((f) => f.status === "open");
    if (openFindings.length) {
      push("## Open remediation backlog");
      for (const f of openFindings.slice(0, 15)) push(`- [${f.level}] ${RULEBOOK[f.guideline].name} \u00b7 ${f.fileName}: ${f.name}`);
      push();
    }
    const confirmedTopics = (report.topics ?? []).filter((t) => topicLabels[t.id] !== undefined);
    if (confirmedTopics.length) {
      push("## Confirmed topics");
      for (const t of confirmedTopics) push(`- **${topicLabels[t.id]}**: ${t.memberNames.join(", ")}`);
      push();
    }
    if (report.languages.length) {
      push(`Language mix (heuristic, prose files): ${report.languages.map((l) => `${l.label} \u00d7${l.files}`).join(", ")}`);
      push();
    }
    if (lastProof) {
      push("## Cleaning-to-quality proof (measured in-browser)");
      push(`Raw ${lastProof.r.raw.accuracyPct}% \u2192 cleaned ${lastProof.r.cleaned.accuracyPct}% golden-set retrieval accuracy; stale evidence ${lastProof.r.raw.staleSharePct}% \u2192 ${lastProof.r.cleaned.staleSharePct}%${lastProof.preview ? " (preview run with recommended resolutions)" : ""}.`);
      push();
    }
    push("---");
    push("Deterministic in-browser analysis \u00b7 Data Lab, AI Program Command Center \u00b7 no data left this browser.");
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corpus-readiness-dossier.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT: intake */}
      <div className="space-y-6 lg:col-span-1">
        <Panel>
          <SectionHeader title="Build a corpus" description="Profile many files at once" icon={UploadCloud} />
          <button
            onClick={loadSampleCorpus}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary-dark"
          >
            <Sparkles className="h-4 w-4" /> Load sample corpus (6 files)
          </button>
          <label
            htmlFor="corpusInput"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
            }}
            className={cn(
              "block cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
              dragOver ? "border-primary bg-primary-soft" : "border-line bg-slate-50/60 hover:bg-slate-50",
            )}
          >
            <FileUp className="mx-auto h-6 w-6 text-slatey-400" />
            <div className="mt-1.5 text-sm font-medium text-ink">
              Drop multiple files or <span className="text-primary">browse</span>
            </div>
            <div className="mt-0.5 text-xs text-slatey-400">CSV · JSON · TXT · MD · PDF · DOCX</div>
            <input
              ref={fileRef}
              id="corpusInput"
              type="file"
              multiple
              accept={CORPUS_UPLOAD_ACCEPT}
              className="hidden"
              onChange={(e) => e.target.files && onFiles(e.target.files)}
            />
          </label>
          {parseErrors.length > 0 && (
            <div className="mt-3 rounded-lg border border-status-risk/30 bg-status-risk/[0.06] p-2.5 text-[11px] leading-relaxed text-status-risk">
              <div className="mb-1 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" /> {parseErrors.length} file{parseErrors.length > 1 ? "s" : ""} skipped
              </div>
              <ul className="list-disc space-y-0.5 pl-4">
                {parseErrors.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {report && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={downloadDossier} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-slatey-200 hover:text-ink">
                <FileDown className="h-3.5 w-3.5" /> Readiness dossier (.md)
              </button>
              <button onClick={reset} className="inline-flex items-center gap-1 text-xs font-medium text-slatey-300 hover:text-slatey-100">
                <RotateCcw className="h-3.5 w-3.5" /> Clear corpus
              </button>
            </div>
          )}
        </Panel>

        {report && (
          <Panel>
            <SectionHeader title="Compliance profile" description="Re scores the whole corpus" icon={SlidersHorizontal} />
            <RuleProfileSelector value={profileId} onChange={changeProfile} />
            <p className="mt-2 font-mono text-[11px] text-slatey-400">Active: {getProfile(profileId).name}</p>
          </Panel>
        )}
      </div>

      {/* RIGHT */}
      <div className="space-y-6 lg:col-span-2">
        {!report && !running && <EmptyCorpus onLoad={loadSampleCorpus} />}
        {running && <div className="panel p-10 text-center text-sm text-slatey-300">Analyzing corpus…</div>}

        {report && adjusted && (
          <>
            <CorpusHealth report={{ ...report, health: adjusted.health }} />

            {/* Guided corpus pass (Phase 5): the three-beat path through the lab. */}
            <ol className="flex flex-wrap items-center gap-2 text-[11px]" aria-label="Guided corpus pass">
              {[
                { n: 1, label: "Profile the corpus", done: stepProfile, href: "#corpus-board" },
                { n: 2, label: "Resolve duplicates & versions", done: stepResolve, href: "#corpus-resolution" },
                { n: 3, label: "Clear criticals & hand off", done: stepHandoff, href: "#corpus-board" },
              ].map((st) => (
                <li key={st.n}>
                  <a
                    href={st.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors hover:border-primary/40",
                      st.done ? "border-emerald-200 bg-emerald-50/70 text-emerald-700" : "border-line bg-white text-slatey-400 hover:text-ink",
                    )}
                  >
                    <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold", st.done ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600")}>
                      {st.done ? "\u2713" : st.n}
                    </span>
                    {st.label}
                  </a>
                </li>
              ))}
              {stepHandoff ? (
                <li>
                  <button onClick={downloadDossier} className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-2.5 py-1 font-semibold text-primary hover:bg-primary/10">
                    <FileDown className="h-3 w-3" /> Download the readiness dossier
                  </button>
                </li>
              ) : (
                <li className="text-slatey-500">then the handoff on the <span className="font-medium">Data</span> page carries it to Build.</li>
              )}
            </ol>

            <div id="corpus-board" className="scroll-mt-24" />
            <ReadinessBoard
              files={adjusted.files}
              findings={adjusted.findings}
              rollups={adjusted.rollups}
              selectedId={selectedId}
              onSelectFile={setSelectedId}
            />

            <RemediationBacklog
              findings={adjusted.findings}
              onSetStatus={(key, status) => setStatuses((m) => ({ ...m, [key]: status }))}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <Panel>
                <div className="flex items-start justify-between gap-2">
                  <SectionHeader title="Corpus atlas" description="Distance = content similarity (PCA), click an edge to resolve its set" icon={Boxes} />
                  <div className="inline-flex shrink-0 rounded-lg border border-line bg-white p-0.5" role="group" aria-label="Atlas view mode">
                    {(["2d", "3d"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setAtlasMode(m)}
                        aria-pressed={atlasMode === m}
                        disabled={m === "3d" && adjusted.activeFiles.length < 4}
                        title={m === "3d" && adjusted.activeFiles.length < 4 ? "3D needs at least 4 documents" : undefined}
                        className={cn(
                          "rounded-md px-2 py-1 text-[11px] font-semibold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                          atlasMode === m ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/25" : "text-slatey-400 hover:text-ink",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                {atlasMode === "3d" && adjusted.activeFiles.length >= 4 ? (
                  <CorpusAtlas3D
                    files={adjusted.activeFiles}
                    pairs={adjusted.activePairs}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                ) : (
                  <CorpusStarMap
                    files={adjusted.activeFiles}
                    pairs={adjusted.activePairs}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onEdgeClick={(p) => setFocusSetId(setIdForPair(sets, p))}
                    hulls={hulls}
                  />
                )}
                {(adjusted.health.excluded ?? 0) > 0 && (
                  <p className="mt-2 text-[11px] text-slatey-500">
                    {adjusted.health.excluded} file{(adjusted.health.excluded ?? 0) > 1 ? "s" : ""} excluded by resolution, no longer part of the active corpus.
                  </p>
                )}
                {report.languages.length > 0 && (
                  <p className="mt-1 text-[11px] text-slatey-500">
                    Language mix (heuristic, prose files): {report.languages.map((l) => `${l.label} \u00d7${l.files}`).join(" \u00b7 ")}
                  </p>
                )}
              </Panel>

              <div id="corpus-resolution" className="scroll-mt-24" />
            <DuplicateResolution
                sets={sets}
                resolutions={resolutions}
                focusSetId={focusSetId}
                onResolve={(setId, keepId) => {
                  setResolutions((m) => ({ ...m, [setId]: { keepId } }));
                  setFocusSetId(null);
                }}
                onUndo={(setId) => setResolutions((m) => {
                  const next = { ...m };
                  delete next[setId];
                  return next;
                })}
              />
            </div>

            <TopicGroups
              topics={report.topics}
              confirmed={topicLabels}
              onConfirm={(id, label) => setTopicLabels((m) => ({ ...m, [id]: label }))}
              onUnconfirm={(id) => setTopicLabels((m) => {
                const next = { ...m };
                delete next[id];
                return next;
              })}
            />

            <div id="corpus-proof" className="scroll-mt-24" />
            <CleaningProof
              files={(inputs ?? []).map((f) => ({ name: f.name, text: f.text }))}
              excludedNames={excludedNames}
              topicsByFile={topicsByFile}
              hasResolutions={Object.keys(resolutions).length > 0}
              previewExclusions={previewExclusions}
              onResult={(r, preview) => setLastProof({ r, preview })}
            />


            {/* File tray */}
            <Panel>
              <SectionHeader title="Files in this corpus" description="Click a file to inspect its gate and issues" icon={Layers} />
              {selected && (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary-soft/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium text-ink">{selected.name}</span>
                    <Badge color={selected.gate.color}>{selected.gate.gate}</Badge>
                    <span className="font-mono text-[11px] text-slatey-400">score {selected.score} · {selected.tokens.toLocaleString()} tokens</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-slatey-300">{selected.gate.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.report.checks
                      .filter((c) => c.level !== "healthy")
                      .slice(0, 4)
                      .map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slatey-200 ring-1 ring-inset ring-line">
                          {c.name}
                        </span>
                      ))}
                  </div>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {adjusted.files.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedId(f.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      f.id === selectedId ? "border-primary/40 bg-primary-soft/40" : "border-line bg-white hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-[12px] text-slatey-100">{f.name}</span>
                      {f.excluded ? <Badge color="slate">excluded</Badge> : <Badge color={f.gate.color}>{`score ${f.score}`}</Badge>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slatey-400">
                      {f.gate.gate === "Approved" ? (
                        <CircleCheck className="h-3.5 w-3.5 text-status-healthy" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5 text-status-risk" />
                      )}
                      {f.gate.gate}
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCorpus({ onLoad }: { onLoad: () => void }) {
  return (
    <div className="panel p-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary">
        <Boxes className="h-6 w-6" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-ink">Build a corpus to see the bigger picture</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slatey-300">
        Single-file checks can&apos;t catch duplicates, stale versions, or conflicting sources. Load a few files and the
        Corpus Builder maps how they relate and rolls up a corpus-readiness score.
      </p>
      <button
        onClick={onLoad}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-glow hover:bg-primary-dark"
      >
        <Sparkles className="h-4 w-4" /> Load sample corpus
      </button>
    </div>
  );
}

function CorpusHealth({ report }: { report: CorpusReport }) {
  const h = report.health;
  const segs = [
    { ...GATE_SEG[0], n: h.approved },
    { ...GATE_SEG[1], n: h.conditional },
    { ...GATE_SEG[2], n: h.hold },
    { ...GATE_SEG[3], n: h.rejected },
  ];
  const metrics: { label: string; value: string; color: BadgeColor }[] = [
    { label: "Corpus ready", value: `${h.readyPct}%`, color: h.readyPct >= 70 ? "emerald" : h.readyPct >= 40 ? "amber" : "orange" },
    { label: "Avg file score", value: String(h.avgScore), color: "blue" },
    { label: "Files", value: String(h.total), color: "blue" },
    { label: "Duplicates", value: String(h.duplicates), color: h.duplicates ? "rose" : "emerald" },
    { label: "Conflicts", value: String(h.conflicts), color: h.conflicts ? "amber" : "emerald" },
  ];
  return (
    <Panel>
      <SectionHeader title="Corpus health" description="What the whole batch looks like before it reaches the RAG Evaluator" icon={Boxes} />
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-line bg-slate-50 p-3">
            <div className="stat-label">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-ink">{m.value}</div>
            <div className="mt-1">
              <Badge color={m.color}>
                {m.label === "Corpus ready" ? "approved / active files" : m.label === "Conflicts" ? "stale versions" : m.label === "Avg file score" ? "mean of file gates" : "across corpus"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="stat-label mb-1.5">Gate distribution</div>
        <div className="flex h-6 w-full overflow-hidden rounded-md bg-slate-100">
          {segs.map(
            (s) =>
              s.n > 0 && (
                <div
                  key={s.key}
                  className={cn("flex items-center justify-center text-[10px] font-semibold text-white", s.bg)}
                  style={{ width: `${(s.n / h.total) * 100}%` }}
                  title={`${s.label}: ${s.n}`}
                >
                  {s.n}
                </div>
              ),
          )}
        </div>
      </div>
    </Panel>
  );
}
