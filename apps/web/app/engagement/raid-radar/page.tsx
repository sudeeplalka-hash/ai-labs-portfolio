import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { RaidRadar } from "@/components/engagement/RaidRadar";

export const metadata: Metadata = {
  ...routeMetadata("EL-04 \u00b7 Delivery Health and RAID Radar", "Inspect el-04 \u00b7 delivery health and raid radar through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/engagement/raid-radar"),
  title: "EL-04 · Delivery Health and RAID Radar",
  description:
    "A RAID radar that reports trajectory, not snapshots, surfacing the workstream that reads green but is trending into trouble, then drafting the leadership status narrative.",
};

export default function Page() {
  return <RaidRadar />;
}
