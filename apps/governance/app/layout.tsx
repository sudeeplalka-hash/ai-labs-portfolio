import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-governance-control-plane.netlify.app'),
  title: {
    default: 'Enterprise AI Governance Control Plane',
    template: '%s · AI Governance Control Plane',
  },
  description: 'A live, interactive lab for governing enterprise GenAI: risk tiering, policy-as-code, runtime guardrails, human review, red-team evals, and audit-ready evidence.',
  applicationName: 'AI Governance Control Plane',
  openGraph: {
    title: 'Enterprise AI Governance Control Plane',
    description: 'See an unguarded AI cause harm, then watch the control plane catch it. An interactive governance lab.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#152433',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar />
          <main className="flex-1 md:ml-64 min-h-screen">
            <Topbar />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
