import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProgramProvider } from "@labs/program-core";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolio.sudeeplalka.com"),
  title: {
    default: "Sudeep Lalka — AI Delivery Leadership Portfolio",
    template: "%s · Sudeep Lalka",
  },
  description:
    "One AI delivery leader at four altitudes — the protocol wire, the program lifecycle, the P&L, and the people. A portfolio of working instruments, each mapped to a real enterprise decision.",
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
