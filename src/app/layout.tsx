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
  metadataBase: new URL("https://nexspace.space"),

  title: {
    default: "NexSpace",
    template: "%s | NexSpace",
  },

  description:
    "NexSpace OS — Focus, Tasks, Diary, Planning, Workspace and Personal Growth in one unified execution system.",

  keywords: [
    "NexSpace",
    "NexSpace OS",
    "Personal Dashboard",
    "Productivity",
    "Focus",
    "Task Management",
    "Planning",
    "Diary",
    "Workspace",
    "Goal Tracking",
    "Personal Growth",
    "Execution System",
    "NexUP",
    "Productivity OS",
  ],

  applicationName: "NexSpace",

  authors: [
    {
      name: "Jothish Gandham",
    },
  ],

  creator: "Jothish Gandham",
  publisher: "NexSpace",

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

  formatDetection: {
    telephone: false,
  },

  openGraph: {
    type: "website",
    url: "https://nexspace.space",
    title: "NexSpace",
    description:
      "Focus, Tasks, Diary, Planning, Workspace and Personal Growth in one unified execution system.",
    siteName: "NexSpace",
  },

  twitter: {
    card: "summary_large_image",
    title: "NexSpace",
    description:
      "Focus, Tasks, Diary, Planning, Workspace and Personal Growth in one unified execution system.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  category: "Productivity",
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