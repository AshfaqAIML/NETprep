import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { ApkPromptProvider } from "@/components/apk/apk-prompt-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NETPrep Hub — UGC NET Preparation Platform",
  description:
    "Books, notes, cheat sheets, PYQs, MCQ practice, mock tests, study planner and progress tracking — everything you need for UGC NET preparation in one place.",
  keywords: [
    "UGC NET",
    "NET preparation",
    "JRF",
    "Assistant Professor",
    "Paper I",
    "Paper II",
    "Mock Test",
    "PYQ",
    "NETPrep Hub",
  ],
  authors: [{ name: "NETPrep Hub" }],
  applicationName: "NETPrep Hub",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "NETPrep Hub — UGC NET Preparation Platform",
    description:
      "Prepare smarter for UGC NET. Notes, cheat sheets, PYQs, mock tests, analytics & study planner in one place.",
    siteName: "NETPrep Hub",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" richColors />
            {/* First-visit Android APK prompt. Renders nothing for all
                existing flows until an APK artifact is published. */}
            <ApkPromptProvider />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
