import { routeMetadata } from "@/lib/site";
import UseCaseDetail from './UseCaseDetail';

// Fixed IDs match the deterministic seed data in backend/app/core/seed.py.
// This allows Next.js to pre-generate HTML for each use case at build time.
export function generateStaticParams() {
  return [
    { id: '11111111-1111-1111-1111-111111111111' },
    { id: '22222222-2222-2222-2222-222222222222' },
    { id: '33333333-3333-3333-3333-333333333333' },
    { id: '44444444-4444-4444-4444-444444444444' },
    { id: '55555555-5555-5555-5555-555555555555' },
  ];
}

export function generateMetadata({ params }: { params: { id: string } }) {
  return { ...routeMetadata("Modeled governance use case", "Inspect the seeded use case, its risk and control evidence.", `/govern/use-cases/${params.id}`), robots: { index: false, follow: true } };
}

export default function Page({ params }: { params: { id: string } }) {
  return <UseCaseDetail id={params.id} />;
}
