import type { Metadata, Viewport } from "next";
import { Geist_Mono, Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { OIDCAuthProvider } from "@/components/auth/OIDCAuthProvider";
import { RealtimeNotifications } from "@/components/common/RealtimeNotifications";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PreventNumberInputScroll } from "@/components/common/PreventNumberInputScroll";
import { NativeAppInit } from "@/components/native/NativeAppInit";

// Playful rounded display font for headings/titles and card titles (kid-friendly, IXL-style)
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Clean, friendly, highly readable sans for body / general text
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    icon: [
      {
        url: "/MyClassCast36.png",
        sizes: "any",
        type: "image/png",
      },
      {
        url: "/MyClassCast36.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/MyClassCast36.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: "/MyClassCast36.png",
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
