import { routeMetadata } from "@/lib/site";
export const metadata = { ...routeMetadata("Create a modeled use case", "Local governance demonstration configuration.", "/govern/use-cases/new"), robots: { index: false, follow: true } };
export default function RouteLayout({ children }: { children: React.ReactNode }) { return children; }
