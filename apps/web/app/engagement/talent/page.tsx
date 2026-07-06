import type { Metadata } from "next";
import { TalentPlanner } from "@/components/engagement/TalentPlanner";

export const metadata: Metadata = {
  title: "EL-06 · Talent & Upskilling Pathway Planner",
  description:
    "Map the team's current coverage against the agentic-era skill target, see the gaps, and pick build / hire / partner per capability with a time-to-ready, because the stack moves faster than the team.",
};

export default function Page() {
  return <TalentPlanner />;
}
