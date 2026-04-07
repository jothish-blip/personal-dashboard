import type { Metadata, Viewport } from "next";
// Import high-performance local fonts (replaces Google Fonts)
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import TopProgressBar from "@/components/TopProgressBar";
import OfflineView from "@/app/not-found/OfflineView";
import PWARegistration from "@/components/PWARegistration";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: '%s | NexTask',
    default: 'Task Engine | NexTask',
  },
  description: "Your personal execution and life engine.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico", 
    apple: "/favicon.ico", 
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NexTask",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F9FAFB] text-slate-900 selection:bg-orange-100">
        <PWARegistration />
        <TopProgressBar />
        <OfflineView />
        {children}
      </body>
    </html>
  );
}