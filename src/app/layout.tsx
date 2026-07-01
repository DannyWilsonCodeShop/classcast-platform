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
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ClassCast - Learning Management System",
  description: "A modern learning management system for students and instructors",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ClassCast",
  },
  icons: {
    icon: [
      {
        url: "/greenlogo.png",
        sizes: "any",
        type: "image/png",
      },
      {
        url: "/greenlogo.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/greenlogo.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: "/greenlogo.png",
    apple: "/greenlogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
