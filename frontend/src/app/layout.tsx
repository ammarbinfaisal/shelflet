import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import Link from "next/link";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { config } from "@/lib/config";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: config.siteName,
  description: config.siteDescription,
  robots: config.robotsDisallow
    ? { index: false, follow: false, nocache: true }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${lexend.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-[family-name:var(--font-lexend)]">
        <header className="border-b border-neutral-200 px-3 py-3 sm:px-6 sm:py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-lg sm:text-xl font-semibold tracking-tight">
              {config.siteName}
            </Link>
            <Link
              href="/admin"
              className="text-sm text-neutral-500 hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </div>
        </header>
        <AuthProvider>
          <main className="flex-1 max-w-5xl mx-auto w-full px-2 py-4 sm:px-6 sm:py-8">
            {children}
          </main>
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
