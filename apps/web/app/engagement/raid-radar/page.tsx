import type { Metadata } from "next";
import { RaidRadar } from "@/components/engagement/RaidRadar";

export const metadata: Metadata = {
  title: "EL-04 · Delivery Health & RAID Radar",
  description:
    "A RAID radar that reports trajectory, not snapshots, surfacing the workstream that reads green but is trending into trouble, then drafting the leadership status narrative.",
};

export default function Page() {
  return <RaidRadar />;
}
