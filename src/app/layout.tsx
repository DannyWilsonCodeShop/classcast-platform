import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { OIDCAuthProvider } from "@/components/auth/OIDCAuthProvider";
import { RealtimeNotifications } from "@/components/common/RealtimeNotifications";
import { QueryProvider } from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClassCast - Learning Management System",
  description: "A modern learning management system for students and instructors",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <OIDCAuthProvider>
            <AuthProvider>
              {children}
              <RealtimeNotifications />
            </AuthProvider>
          </OIDCAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
