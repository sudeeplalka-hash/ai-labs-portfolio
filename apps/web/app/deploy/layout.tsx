// Deploy's sections moved INTO the Header band (see Header.tsx / StageNav.tsx). Its
// hash-links (envelope / compare / under-load / incident) still address the in-page
// sections the view scrolls between; the nav renders from kit's STAGE_SECTIONS as a
// flat chip row, since Deploy is five items with no acts (R2.2 holds).
export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
