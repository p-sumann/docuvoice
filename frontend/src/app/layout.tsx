import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocuVoice — Talk to Your Documents",
  description:
    "Voice-powered document analysis platform for insurance claims, legal contracts, and financial due diligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[var(--dv-bg-base)] text-[var(--dv-text-primary)]`}
      >
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--dv-bg-elevated)",
              border: "1px solid var(--dv-border-default)",
              color: "var(--dv-text-primary)",
            },
          }}
        />
      </body>
    </html>
  );
}
