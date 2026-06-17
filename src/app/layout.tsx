import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";

import TopProgressBar from "@/refresh/TopProgressBar";
import OfflineView from "@/app/not-found/OfflineView";
import PWARegistration from "@/pwa/PWARegistration";
import ModuleContainer from "@/navigation/moduleNavigation/ModuleContainer";
import ClientWrapper from "@/pwa/ClientWrapper";
import { FocusProvider } from "@/modules/focus/engine/useFocusSystem";

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
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('nexspace_theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  var finalTheme = stored ? stored : (systemDark ? 'dark' : 'light');
                  
                  document.documentElement.classList.toggle('dark', finalTheme === 'dark');
                  document.documentElement.style.colorScheme = finalTheme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="overflow-x-hidden">
        {/* SYSTEM LAYER */}
        <PWARegistration />
        <TopProgressBar />
        <OfflineView />

        {/* APP LAYER */}
        <FocusProvider>
          <ClientWrapper>
            <ModuleContainer>
              {children}
            </ModuleContainer>
          </ClientWrapper>
        </FocusProvider>

      </body>
    </html>
  );
}