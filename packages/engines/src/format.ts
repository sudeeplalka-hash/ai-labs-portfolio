// Artifact formatting (shared by the download engine).
// The provenance footer extends the honesty doctrine into every generated file;
// the CSV helpers escape correctly. Pure — no DOM, so they are unit-testable.

export interface ArtifactProvenance {
  scenario: string;
  mode?: "SIMULATED" | "LIVE";
  note?: string;
}

export function provenanceFooter(p: ArtifactProvenance, now: Date = new Date()): string {
  const date = now.toISOString().slice(0, 10);
  const mode = p.mode ?? "SIMULATED";
  return [
    "",
    "---",
    `*Generated ${date} · Scenario: ${p.scenario} · ${mode} · AI Labs Portfolio — portfolio.sudeeplalka.com*`,
    `*${p.note ?? "Illustrative: figures are authored sample data unless a live model is connected. Structure and reasoning are the point, not the numbers."}*`,
  ].join("\n");
}

export function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}
