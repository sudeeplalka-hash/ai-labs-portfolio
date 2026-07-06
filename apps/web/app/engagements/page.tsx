import type { Metadata } from "next";
import { Engagements } from "../../components/reviewer/Engagements";

export const metadata: Metadata = {
  title: "Engagements · anonymized case studies",
  description:
    "Ten-plus years of enterprise AI, cloud, and platform delivery — real engagements as walk-through case studies, with client names abstracted and figures adjusted to protect confidentiality.",
};

export default function EngagementsPage() {
  return <Engagements />;
}
