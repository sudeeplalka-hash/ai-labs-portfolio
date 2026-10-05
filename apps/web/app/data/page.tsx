import { routeMetadata } from "@/lib/site";
import type { Metadata } from "next";
import { DataStage } from "@/components/stages/DataStage";

export const metadata: Metadata = {
  ...routeMetadata("Data", "Inspect data through the enterprise AI portfolio: visible evidence, interactive scenarios and stated assumptions.", "/data"), title: "Data" };

export default function Page() {
  return <DataStage />;
}
