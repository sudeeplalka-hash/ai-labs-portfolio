import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import { PageIntro } from "@labs/design-system";
import { UnderTheHood } from "@/components/build/UnderTheHood";

export const metadata: Metadata = { title: "Under the Hood" };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Stage 03 · Build — Under the Hood" title="Under the Hood: model internals" icon={Boxes}>
        A lightweight, optional explanation of transformers, attention, embeddings, and ML frameworks — and where they fit in an
        enterprise AI lifecycle. This is explanation, not implementation: the Command Center operates above the raw model layer.
      </PageIntro>
      <UnderTheHood />
    </div>
  );
}
