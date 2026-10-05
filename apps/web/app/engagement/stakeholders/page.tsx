import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { StakeholderCockpit } from "@/components/engagement/StakeholderCockpit";

export const metadata: Metadata = {
  ...routeMetadata("EL-02 \u00b7 Stakeholder and Sponsor Alignment Cockpit", "Inspect el-02 \u00b7 stakeholder and sponsor alignment cockpit through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/engagement/stakeholders"),
  title: "EL-02 · Stakeholder and Sponsor Alignment Cockpit",
  description:
    "A power/interest grid of stakeholders with sentiment trajectories over program weeks, spot the sponsor drifting from champion to neutral and get an auto drafted pre steering briefing.",
};

export default function Page() {
  return <StakeholderCockpit />;
}
