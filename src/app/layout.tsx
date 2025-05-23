/**
 * layout.tsx
 *
 * PURPOSE:
 * This file defines the root layout structure for the Next.js application.
 * It sets global fonts, wraps all pages in a consistent HTML and body tag,
 * and applies top-level styles like antialiasing.
 *
 * USE THIS WHEN:
 * - You want to apply global font settings or layout wrappers
 * - You need to inject metadata or language configuration site-wide
 * - You’re customizing root-level page rendering or layout behavior
 *
 * FEATURES:
 * - Loads and applies Geist Sans and Geist Mono fonts via next/font
 * - Imports global styles from `globals.css`
 * - Renders children inside the configured layout shell
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Talk to My Resume – Sara's AI",
  description: "Ask questions about Sara Swart’s background, experience, and skills using her AI-powered resume chatbot.",
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
        {children}
      </body>
    </html>
  );
}
