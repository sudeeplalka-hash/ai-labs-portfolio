import { PageIntro } from "@data/components/common/PageIntro";
import { TechnicalDashboard } from "@data/components/dashboard/TechnicalDashboard";

export const metadata = { title: "Technical Pipeline" };

export default function Page() {
  return (
    <div>
      <PageIntro eyebrow="Dashboard · demo or your sessions" title="Technical Pipeline">
        Stage-by-stage detail of the preparation engine, the quality dimensions it scores, and the per-file state —
        for the demo batch, or recomputed from your own Live Data Lab and Corpus Builder sessions.
      </PageIntro>
      <TechnicalDashboard />
    </div>
  );
}
