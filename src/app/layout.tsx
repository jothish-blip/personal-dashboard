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
    default: "NexSpace — Personal Execution OS",
    template: "%s | NexSpace",
  },

  description:
    "NexSpace is a personal execution operating system that unifies Focus, Tasks, Planning, Diary, Goals, Sessions, Workspace, and Personal Growth into one structured environment for deep work and life management.",

  keywords: [
    "NexSpace",
    "Personal Execution OS",
    "Productivity OS",
    "Focus Management",
    "Deep Work",
    "Task Management",
    "Goal Tracking",
    "Planning System",
    "Digital Workspace",
    "Daily Planning",
    "Personal Growth",
    "Focus Sessions",
    "Life Management",
    "Execution System",
    "Second Brain",
    "Personal Dashboard",
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
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
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
    title: "NexSpace — Personal Execution OS",
    description:
      "Focus, Tasks, Planning, Goals, Diary, Sessions, Workspace, and Personal Growth unified in one execution system.",
    siteName: "NexSpace",
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "NexSpace — Personal Execution OS",
    description:
      "A unified operating system for focus, planning, execution, productivity, and personal growth.",
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

  category: "Productivity Software",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "NexSpace",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    description: "Personal Execution OS for focus, planning, tasks and growth.",
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <head>
        <Script
          id="schema-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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