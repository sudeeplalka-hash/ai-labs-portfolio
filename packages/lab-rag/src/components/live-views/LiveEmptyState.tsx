import Link from "next/link";
import { FlaskConical, ArrowRight } from "lucide-react";
import { Panel } from "@rag/components/common/Panel";

export function LiveEmptyState({ what }: { what: string }) {
  return (
    <Panel className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
        <FlaskConical className="h-6 w-6" />
      </span>
      <div>
        <p className="text-base font-semibold text-ink">No live sessions yet</p>
        <p className="mt-1 max-w-md text-sm text-slatey-400">
          {what} will appear here once you ask questions in the Live RAG Evaluator Lab. Everything is computed from your own
          documents and questions, right in your browser.
        </p>
      </div>
      <Link
        href="/build"
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        Open the Lab <ArrowRight className="h-4 w-4" />
      </Link>
    </Panel>
  );
}
