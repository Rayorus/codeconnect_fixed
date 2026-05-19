import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CodeConnect — AI-Powered Developer Network",
  description:
    "Connect with fellow developers, track LeetCode progress, share doubts, and grow together with AI-powered collaboration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-cc-bg text-cc-text antialiased w-full">
        {/* Lightweight ambient glow */}
        <div className="ambient-bg" aria-hidden="true">
          <div className="ambient-orb ambient-orb-1" />
          <div className="ambient-orb ambient-orb-2" />
        </div>
        <div className="fixed inset-0 grid-pattern pointer-events-none z-0" aria-hidden="true" />
        <main className="w-full min-h-screen flex flex-col relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
