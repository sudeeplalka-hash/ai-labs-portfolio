import type { Metadata } from "next";
import { DataStage } from "@/components/stages/DataStage";

export const metadata: Metadata = { title: "Data" };

export default function Page() {
  return <DataStage />;
}
