import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { OIDCAuthProvider } from "@/components/auth/OIDCAuthProvider";
import { RealtimeNotifications } from "@/components/common/RealtimeNotifications";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PreventNumberInputScroll } from "@/components/common/PreventNumberInputScroll";
import { NativeAppInit } from "@/components/native/NativeAppInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
        url: "/UpdatedCCLogo.png",
        sizes: "any",
        type: "image/png",
      },
      {
        url: "/UpdatedCCLogo.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/UpdatedCCLogo.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: "/UpdatedCCLogo.png",
    apple: "/UpdatedCCLogo.png",
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
        <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}
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
