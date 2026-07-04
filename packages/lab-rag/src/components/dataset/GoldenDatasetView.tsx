"use client";

import { useMemo, useState } from "react";
import { Search, Database, Filter } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { RiskBadge, EvalStatusBadge } from "@rag/components/common/Badge";
import { EmptyState } from "@rag/components/common/EmptyState";
import { goldenDataset } from "@rag/data/goldenDataset";
import { cn } from "@rag/lib/cn";

const ALL = "All";

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-slatey-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-line bg-navy-950/60 px-2.5 py-1.5 text-xs text-ink focus:border-accent/50 focus:outline-none"
      >
        {[ALL, ...options].map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function GoldenDatasetView() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(ALL);
  const [risk, setRisk] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [review, setReview] = useState(ALL);

  const categories = useMemo(() => Array.from(new Set(goldenDataset.map((d) => d.category))).sort(), []);

  const rows = goldenDataset.filter((d) => {
    if (q && !d.question.toLowerCase().includes(q.toLowerCase())) return false;
    if (category !== ALL && d.category !== category) return false;
    if (risk !== ALL && d.riskLevel !== risk) return false;
    if (difficulty !== ALL && d.difficulty !== difficulty) return false;
    if (status !== ALL && d.testStatus !== status) return false;
    if (review !== ALL && (review === "Yes") !== d.humanReviewRequired) return false;
    return true;
  });

  const passed = goldenDataset.filter((d) => d.testStatus === "Passed").length;
  const review_n = goldenDataset.filter((d) => d.humanReviewRequired).length;
  const critical = goldenDataset.filter((d) => d.riskLevel === "Critical").length;

  const summary = [
    { label: "Total Cases", value: goldenDataset.length },
    { label: "Passing", value: `${passed} (${Math.round((passed / goldenDataset.length) * 100)}%)` },
    { label: "Critical-Risk", value: critical },
    { label: "Require Human Review", value: review_n },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="panel p-4">
            <p className="stat-label">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <Panel>
        <SectionHeader title="Golden Dataset" description="The evaluation test suite. Filter by domain, risk, difficulty, and status." icon={Database} />
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-1 flex-col gap-1" style={{ minWidth: 200 }}>
            <span className="text-[11px] text-slatey-500">Search questions</span>
            <span className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slatey-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g. reimbursement, security exception..."
                className="w-full rounded-lg border border-line bg-navy-950/60 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-slatey-500 focus:border-accent/50 focus:outline-none"
              />
            </span>
          </label>
          <Select label="Category" value={category} options={categories} onChange={setCategory} />
          <Select label="Risk" value={risk} options={["Low", "Medium", "High", "Critical"]} onChange={setRisk} />
          <Select label="Difficulty" value={difficulty} options={["Easy", "Medium", "Hard", "Edge Case"]} onChange={setDifficulty} />
          <Select label="Status" value={status} options={["Passed", "Failed", "Needs Review", "Skipped"]} onChange={setStatus} />
          <Select label="Review" value={review} options={["Yes", "No"]} onChange={setReview} />
        </div>

        <div className="flex items-center gap-2 pb-2 text-xs text-slatey-400">
          <Filter className="h-3.5 w-3.5" /> Showing {rows.length} of {goldenDataset.length} cases
        </div>

        {rows.length === 0 ? (
          <EmptyState message="No cases match these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[1000px]">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Required Source</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td className="max-w-[280px]">
                      <span className="font-medium text-ink">{d.question}</span>
                      <span className="mt-0.5 block text-[11px] text-slatey-500">{d.expectedAnswer}</span>
                    </td>
                    <td className="text-slatey-300">
                      {d.requiredSourceDocument}
                      <span className="block font-mono text-[11px] text-slatey-500">{d.requiredCitation}</span>
                    </td>
                    <td className="whitespace-nowrap text-slatey-300">{d.category}</td>
                    <td className="whitespace-nowrap text-slatey-400">{d.queryType}</td>
                    <td className="whitespace-nowrap text-slatey-400">{d.difficulty}</td>
                    <td><RiskBadge level={d.riskLevel} /></td>
                    <td><EvalStatusBadge status={d.testStatus} /></td>
                    <td className={cn("text-center", d.humanReviewRequired ? "text-amber-700" : "text-slatey-600")}>
                      {d.humanReviewRequired ? "Yes" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
