import type { Metadata } from "next";
import { BuildStage } from "@/components/stages/BuildStage";

export const metadata: Metadata = { title: "Build · RAG" };

export default function Page() {
  return <BuildStage />;
}
