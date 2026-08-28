import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

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
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "NETPrep Hub — UGC NET Preparation Platform",
    description:
      "Prepare smarter for UGC NET. Notes, cheat sheets, PYQs, mock tests, analytics & study planner in one place.",
    siteName: "NETPrep Hub",
    type: "website",
  },
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
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
