import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import TopProgressBar from "@/refresh/TopProgressBar";
import OfflineView from "@/app/not-found/OfflineView";
import PWARegistration from "@/pwa/PWARegistration";
import ClientWrapper from "@/pwa/ClientWrapper";
import ScrollRestoration from "@/refresh/ScrollRestoration";
import { FocusProvider } from "@/modules/focus/engine/useFocusSystem";

// ✅ Sidebar import
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#FAFAFA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | NexSpace",
    default: "NexSpace",
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
    title: "NexSpace",
  },
  applicationName: "NexSpace",
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
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body className="overflow-x-hidden">
        {/* Theme Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('nexspace _theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  var finalTheme = stored ? stored : (systemDark ? 'dark' : 'light');
                  
                  document.documentElement.classList.toggle('dark', finalTheme === 'dark');
                  document.documentElement.style.colorScheme = finalTheme;
                } catch (e) {}
              })();
            `,
          }}
        />

        {/* SYSTEM LAYER */}
        <PWARegistration />
        <TopProgressBar />
        <OfflineView />

        {/* APP LAYER */}
        <FocusProvider>
          <ClientWrapper>

            {/* ✅ Main App Content */}
            <main className="min-h-screen w-full">
              {children}
            </main>

          </ClientWrapper>
        </FocusProvider>

        <ScrollRestoration />
      </body>
    </html>
  );
}