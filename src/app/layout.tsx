import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { OIDCAuthProvider } from "@/components/auth/OIDCAuthProvider";
import { RealtimeNotifications } from "@/components/common/RealtimeNotifications";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PreventNumberInputScroll } from "@/components/common/PreventNumberInputScroll";
import { NativeAppInit } from "@/components/native/NativeAppInit";
import { BootCurtain } from "@/components/common/BootCurtain";
import { NavigationTransition } from "@/components/common/NavigationTransition";
import { MediaFadeIn } from "@/components/common/MediaFadeIn";

// Playful rounded display font for headings/titles and card titles (kid-friendly, IXL-style)
const fredoka = localFont({
  src: "./fonts/fredoka-latin-wght-normal.woff2",
  variable: "--font-fredoka",
  weight: "300 700",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
// Clean, friendly, highly readable sans for body / general text
const nunito = localFont({
  src: "./fonts/nunito-latin-wght-normal.woff2",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
const geistMono = localFont({
  src: "./fonts/geist-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ClassCast - Learning Management System",
  description: "A modern learning management system for students and instructors",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClassCast",
  },
  icons: {
    // One icon tag + apple-touch-icon; the extra same-URL size variants only added duplicate fetches.
    icon: [{ url: "/MyClassCast36.png", sizes: "any", type: "image/png" }],
    apple: "/MyClassCast36.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* DNS prefetch and preconnect for external resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="dns-prefetch" href="https://classcast-videos-463470937777-us-east-1.s3.us-east-1.amazonaws.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,600;8..60,700;8..60,800&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${nunito.variable} ${fredoka.variable} ${geistMono.variable} antialiased`}
        style={{ background: '#f4f7fb' }}
      >
        <BootCurtain />
        <NavigationTransition />
        <MediaFadeIn />
        <QueryProvider>
          <OIDCAuthProvider>
            <AuthProvider>
              <PreventNumberInputScroll />
              <NativeAppInit />
              {children}
              <RealtimeNotifications />
            </AuthProvider>
          </OIDCAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
