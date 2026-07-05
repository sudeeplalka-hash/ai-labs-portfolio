"use client";

// Artifact engine — turns a lab from a dashboard into a tool by letting the
// document it already computes leave the screen. Client-side only (Blob + anchor),
// zero-dependency, works under static export. Every artifact carries a provenance
// footer, extending the type-enforced honesty doctrine into the filesystem:
// nothing downloads without its date, scenario, and SIMULATED/LIVE label attached.

import { Download } from "lucide-react";
import { CURRENT_SITE } from "@/lib/site";

export interface ArtifactProvenance {
  scenario: string;                 // which authored scenario / inputs produced this
  mode?: "SIMULATED" | "LIVE";      // defaults to SIMULATED (no model connected)
  note?: string;                    // optional extra caveat
}

export function provenanceFooter(p: ArtifactProvenance): string {
  const date = new Date().toISOString().slice(0, 10);
  const mode = p.mode ?? "SIMULATED";
  return [
    "",
    "---",
    `*Generated ${date} · Scenario: ${p.scenario} · ${mode} · ${CURRENT_SITE.attribution}*`,
    `*${p.note ?? "Illustrative: figures are authored sample data unless a live model is connected. Structure and reasoning are the point, not the numbers."}*`,
  ].join("\n");
}

// Trigger a Markdown download in the browser. Safe no-op if called server-side.
export function downloadMarkdown(filename: string, body: string, prov: ArtifactProvenance): void {
  if (typeof document === "undefined") return;
  const content = `${body.trimEnd()}\n${provenanceFooter(prov)}\n`;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Trigger a CSV download (for tabular artifacts like a RAID register).
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  if (typeof document === "undefined") return;
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const content = rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ArtifactButton({
  label = "Generate the memo",
  onClick,
  title,
}: {
  label?: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title ?? "Download this artifact (Markdown)"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90"
    >
      <Download className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
