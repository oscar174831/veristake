import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-display"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veristake-demo.vercel.app";
const description =
  "Veristake is the verification layer that catches the denials that shouldn't have happened - and the fraud you shouldn't have paid.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Veristake - Insurance claims, verified by economics.",
    template: "%s | Veristake"
  },
  description,
  alternates: {
    canonical: siteUrl
  },
  openGraph: {
    title: "Veristake - Insurance claims, verified by economics.",
    description,
    url: siteUrl,
    siteName: "Veristake",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Veristake insurance claim verification" }]
  },
  icons: {
    icon: "/favicon.svg"
  },
  twitter: {
    card: "summary_large_image",
    title: "Veristake - Insurance claims, verified by economics.",
    description,
    images: ["/og.png"]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <html lang="en">
      <body className={`${inter.variable} ${sourceSerif.variable} font-sans`}>
        {plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.tagged-events.js"
            strategy="afterInteractive"
          />
        ) : null}
        <a
          href="#main"
          className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-slate-950"
        >
          Skip to content
        </a>
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
        <Footer />
      </body>
    </html>
  );
}
