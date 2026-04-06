import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TopProgressBar from "@/components/TopProgressBar";
import OfflineView from "@/app/not-found/OfflineView";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister"; // ✅ Import here
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | NexTask',
    default: 'Task Engine | NexTask',
  },
  description: "Your personal execution and life engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F9FAFB] text-slate-900 selection:bg-orange-100">
        {/* ✅ Client-side SW registration happens here without breaking Server Component rules */}
        <ServiceWorkerRegister />
        
        <TopProgressBar />
        <OfflineView />
        {children}
      </body>
    </html>
  );
}