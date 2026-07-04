import type { Metadata } from "next";
import { GovernGate } from "@/components/shell/GovernGate";
import { GovernLoop } from "@/components/govern/GovernLoop";
import { NextStageCTA } from "@/components/lifecycle/NextStageCTA";
import ExecutiveCockpit from "@gov/components/ExecutiveCockpit";

export const metadata: Metadata = { title: "Govern" };

export default function Page() {
  return (
    <GovernGate>
      <GovernLoop />
      <NextStageCTA stage="govern" />
      {/* Legacy cockpit is screen-only — printing /govern yields the evidence pack. */}
      <div className="no-print mt-8 border-t border-line pt-6">
        <p className="eyebrow mb-3">Governance control plane</p>
        <ExecutiveCockpit />
      </div>
    </GovernGate>
  );
}
