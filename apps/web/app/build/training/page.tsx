import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { PageIntro } from "@labs/design-system";
import { TrainingReadiness } from "@/components/build/TrainingReadiness";

export const metadata: Metadata = { title: "Training Readiness" };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Stage 03 · Build — Training Readiness" title="Training, fine-tuning &amp; generalization readiness" icon={Scale}>
        Fine-tuning is not always the answer. This lab helps decide when prompting, RAG, fine-tuning, traditional ML, or a hybrid
        approach is appropriate — and whether the data is ready to support that decision. No model is trained here; this is readiness,
        decisioning, and risk only.
      </PageIntro>
      <TrainingReadiness />
    </div>
  );
}
