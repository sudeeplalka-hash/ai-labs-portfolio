import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { ProgramProvider } from "@labs/program-core";
import { AppShell } from "@/components/shell/AppShell";
import { CURRENT_SITE } from "@/lib/site";

// Site identity comes from the build-time SITE flag (lib/site.ts). On the portfolio
// deploy these values are identical to before; the command-center deploy gets its own.
export const metadata: Metadata = {
  metadataBase: new URL(CURRENT_SITE.domain),
  title: {
    default: CURRENT_SITE.titleDefault,
    template: CURRENT_SITE.titleTemplate,
  },
  description: CURRENT_SITE.description,
  openGraph: {
    type: "website",
    siteName: CURRENT_SITE.titleDefault,
    title: CURRENT_SITE.titleDefault,
    description: CURRENT_SITE.description,
    images: [{ url: CURRENT_SITE.ogImage, width: 1200, height: 630, alt: CURRENT_SITE.titleDefault }],
  },
  twitter: {
    card: "summary_large_image",
    title: CURRENT_SITE.titleDefault,
    description: CURRENT_SITE.description,
    images: [CURRENT_SITE.ogImage],
  },
};

export const viewport: Viewport = { themeColor: "#152433" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <ProgramProvider>
          <AppShell>{children}</AppShell>
        </ProgramProvider>
        {/* Vercel Web Analytics: cookieless page-view counts. No-ops (404s the
            script, silently) on non-Vercel hosts and local dev; enable per
            project in Vercel -> Analytics. */}
        <Analytics />
      </body>
    </html>
  );
}
