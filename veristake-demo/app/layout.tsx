import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { QueryProvider } from "@/app/query-provider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Veristake | Insurance Claims Verified by Economics",
  description:
    "A customer-facing demo for licensed insurance carriers evaluating Veristake in their claims pipeline.",
  openGraph: {
    title: "Veristake",
    description: "Insurance claims, verified by economics.",
    images: ["/og.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a
          href="#main"
          className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-slate-950"
        >
          Skip to content
        </a>
        <QueryProvider>
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/88 backdrop-blur dark:border-slate-800 dark:bg-slate-950/88">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/" prefetch={false} className="focus-ring flex items-center gap-3 rounded-md">
                <Image
                  src="/veristake-logo.svg"
                  alt="Veristake"
                  className="h-9 w-9"
                  width={36}
                  height={36}
                />
                <span className="text-base font-semibold tracking-normal">Veristake</span>
              </Link>
              <PersonaSwitcher />
            </div>
          </header>
          <main id="main">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
