import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import TopProgressBar from "@/components/TopProgressBar";
import OfflineView from "@/app/not-found/OfflineView";
import PWARegistration from "@/components/PWARegistration";

import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FAFAFA", // ✅ Light theme (FIXED)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | NexTask",
    default: "NexTask",
  },
  description: "Execution system for focus, tasks and planning",

  manifest: "/manifest.json",

  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // ✅ matches light UI
    title: "NexTask",
  },

  applicationName: "NexTask",

  // ✅ EXTRA PWA polish
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA] text-slate-900">

        {/* ✅ PWA Registration */}
        <PWARegistration />

        {/* ✅ Top Loader */}
        <TopProgressBar />

        {/* ✅ Offline Handling */}
        <OfflineView />

        {/* ✅ App Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

      </body>
    </html>
  );
}