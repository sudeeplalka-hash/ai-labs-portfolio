import type { Metadata, Viewport } from "next";
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
};

export const viewport: Viewport = { themeColor: "#152433" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <ProgramProvider>
          <AppShell>{children}</AppShell>
        </ProgramProvider>
      </body>
    </html>
  );
}
