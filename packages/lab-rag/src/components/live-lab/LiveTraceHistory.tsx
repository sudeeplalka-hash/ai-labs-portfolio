import { History } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";
import { SectionHeader } from "@rag/components/common/SectionHeader";
import { EmptyState } from "@rag/components/common/EmptyState";
import { LiveTraceList } from "./LiveTraceList";
import type { LiveRagLabTrace } from "@rag/types/liveLab";

// Session history of all questions evaluated in the lab. Selecting a row drives
// the evidence, evaluator, chunk, and summary panels above.
export function LiveTraceHistory({
  traces,
  activeId,
  onSelect,
}: {
  traces: LiveRagLabTrace[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Panel>
      <SectionHeader
        title="Trace History"
        description="Every question you asked, scored and saved. Select one to inspect it above."
        icon={History}
      />
      {traces.length === 0 ? (
        <EmptyState message="No traces yet. Ask a question to build your evaluation history." />
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1">
          <LiveTraceList traces={traces} activeId={activeId} onSelect={onSelect} />
        </div>
      )}
    </Panel>
  );
}
