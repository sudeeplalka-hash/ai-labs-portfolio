import { routeMetadata } from "@/lib/site";
export const metadata = { ...routeMetadata("Model and connection settings", "Local governance demonstration configuration.", "/govern/settings"), robots: { index: false, follow: true } };
export default function RouteLayout({ children }: { children: React.ReactNode }) { return children; }
