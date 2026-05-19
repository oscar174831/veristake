import Link from "next/link";
import packageJson from "@/package.json";

const links = [
  { href: "/whitepaper.pdf", label: "Whitepaper" },
  { href: "/demo", label: "Demo" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/docs", label: "Docs" },
  { href: "https://github.com/oscar174831/veristake", label: "GitHub", external: true }
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 text-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-[0.8fr_1fr_1.2fr] lg:px-8">
        <div>
          <p className="font-semibold text-slate-950 dark:text-white">Veristake</p>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Copyright {new Date().getFullYear()} Veristake. v{packageJson.version}
          </p>
        </div>
        <nav className="flex flex-wrap gap-4" aria-label="Footer">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded-md text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="focus-ring rounded-md text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
        <div className="text-slate-500 dark:text-slate-400">
          <p>
            Veristake is software infrastructure. It is not an insurance carrier and does not
            underwrite, sell, or adjudicate insurance policies. Demo transactions occur on testnets only.
          </p>
          <Link href="/legal" prefetch={false} className="focus-ring mt-2 inline-flex rounded-md underline">
            Legal and responsible disclosure
          </Link>
        </div>
      </div>
    </footer>
  );
}
