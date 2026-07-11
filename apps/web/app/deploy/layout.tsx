import { StageSubnav } from "@/components/shell/StageSubnav";

// Deploy · AI Ops gets the same in-page section nav as every other stage
// (R2.2): kit's STAGE_SECTIONS hash-links address the envelope / compare /
// under-load / incident sections the view scrolls between, plus the guide.
export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <StageSubnav stage="deploy" />
      {children}
    </div>
  );
}
