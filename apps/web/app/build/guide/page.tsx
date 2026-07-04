import type { Metadata } from "next";
import { Boxes, FileUp, MessageSquareText, Brain, Search, ShieldCheck, GitCompareArrows } from "lucide-react";
import { LabGuide } from "@/components/shell/LabGuide";

export const metadata: Metadata = { title: "Guide · Build · RAG" };

export default function Page() {
  return (
    <LabGuide
      stage="How this lab works"
      title="Build · RAG, in plain terms"
      icon={Boxes}
      intro="This is where you prove the engine actually works. You give it a real document, ask real questions, and the evaluator scores every answer for trust — retrieval, faithfulness, citations, and hallucination risk — so 'it sounds right' is replaced with 'here's the evidence it's right.'"
      steps={[
        { icon: FileUp, title: "Load a document", body: "Drop in a file or pick a sample. The lab splits it into passages (chunks) and indexes them for retrieval.", why: "RAG answers from your content, not the model's memory — so the document is the source of truth." },
        { icon: MessageSquareText, title: "Ask a question", body: "Retrieval finds the most relevant passages, then the model drafts an answer with citations back to them.", why: "You see the exact evidence behind every answer, not a black-box response." },
        { icon: Brain, title: "Score every answer", body: "The evaluator rates retrieval relevance, faithfulness, citation accuracy, and hallucination risk — and gives an honest verdict.", why: "For anything customer-facing, 'sounds plausible' is not the same as 'grounded and correct.'" },
        { icon: Search, title: "Inspect the trace", body: "See which chunks were retrieved, which were actually used, and the step-by-step processing timeline.", why: "When an answer is wrong, the trace shows you exactly where it broke — retrieval or generation." },
        { icon: ShieldCheck, title: "Quality gate", body: "Each answer passes, warns, or fails, and gets flagged for human review when the risk is too high.", why: "An honest gate keeps untrustworthy answers out before they ever reach a user." },
        { icon: GitCompareArrows, title: "Compare runs", body: "Stack model, retriever, and prompt versions side by side and catch regressions between them.", why: "You can't improve what you don't measure across versions — this is how the engine gets better, safely." },
      ]}
      closing="Build proves the engine is trustworthy and measurable before it ever runs in production."
      closingIcon={Boxes}
    />
  );
}
