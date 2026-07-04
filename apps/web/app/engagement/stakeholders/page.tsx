import type { Metadata } from "next";
import { StakeholderCockpit } from "@/components/engagement/StakeholderCockpit";

export const metadata: Metadata = {
  title: "EL-02 · Stakeholder & Sponsor Alignment Cockpit",
  description:
    "A power/interest grid of stakeholders with sentiment trajectories over program weeks — spot the sponsor drifting from champion to neutral and get an auto-drafted pre-steering briefing.",
};

export default function Page() {
  return <StakeholderCockpit />;
}
