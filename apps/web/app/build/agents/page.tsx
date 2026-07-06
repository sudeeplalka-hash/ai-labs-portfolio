import type { Metadata } from "next";
import { Workflow } from "lucide-react";
import { PageIntro } from "@labs/design-system";
import { AgentTooling } from "@/components/build/AgentTooling";

export const metadata: Metadata = { title: "Agents & Tools" };

export default function Page() {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Stage 03 · Build, Agents &amp; Tools" title="Agent &amp; tool calling mechanics" icon={Workflow}>
        Agentic AI becomes enterprise-ready when tool access is scoped, approvals are explicit, risky actions are blocked, and every
        action is traceable. This lab shows how an assistant can retrieve evidence, select tools, request approvals, and produce
        auditable traces without allowing unsafe autonomous action, not an unconstrained agent, but agentic workflows designed for
        enterprise control.
      </PageIntro>
      <AgentTooling />
    </div>
  );
}
