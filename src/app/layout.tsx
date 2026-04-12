import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import TopProgressBar from "@/components/TopProgressBar";
import OfflineView from "@/app/not-found/OfflineView";
import PWARegistration from "@/components/PWARegistration";
import ClientWrapper from "@/components/ClientWrapper";

// 🔥 FIX: Correctly imported FocusProvider instead of useFocusSystem
import { FocusProvider } from "../components/focus/useFocusSystem";

import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FAFAFA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | Nextask",
    default: "Nextask",
  },
  description: "Execution system for focus, tasks and planning",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nextask",
  },
  applicationName: "Nextask",
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
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body className="bg-[#FAFAFA] text-slate-900 overflow-x-hidden">

        {/* SYSTEM LAYER */}
        <PWARegistration />
        <TopProgressBar />
        <OfflineView />

        {/* APP LAYER */}
        <FocusProvider>
          <ClientWrapper>
            <main className="min-h-screen w-full">
              {children}
            </main>
          </ClientWrapper>
        </FocusProvider>

      </body>
    </html>
  );
}