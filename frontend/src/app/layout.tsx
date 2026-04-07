import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "shelflet",
  description: "Ammar's book collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <header className="border-b border-neutral-200 px-3 py-3 sm:px-6 sm:py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-lg sm:text-xl font-semibold tracking-tight">
              shelflet
            </Link>
            <Link
              href="/admin"
              className="text-sm text-neutral-500 hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-2 py-4 sm:px-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
