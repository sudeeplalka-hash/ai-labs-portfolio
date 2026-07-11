import type { Metadata } from "next";
import { DeployStage } from "@/components/stages/DeployStage";

export const metadata: Metadata = { title: "Deploy · AI Ops" };

export default function Page() {
  return <DeployStage />;
}
