"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ClipboardCheck, LayoutDashboard, Stethoscope, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const links = [
  { href: "/demo/carrier", label: "Carrier", icon: ClipboardCheck },
  { href: "/demo/claimant", label: "Intake", icon: UserCheck },
  { href: "/demo/verifier", label: "Verifier", icon: Stethoscope },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }
];

export function PersonaSwitcher() {
  const pathname = usePathname();
  const isDemo = pathname.startsWith("/demo");
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <nav className="flex items-center gap-2" aria-label="Primary">
      <div className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900 md:flex">
        {links.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "focus-ring inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                active && "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <Link
        href="/demo"
        prefetch={false}
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold md:hidden dark:border-slate-800"
      >
        <Activity className="h-4 w-4" aria-hidden="true" />
        Demo
      </Link>
      {isDashboard ? (
        <Badge tone="teal">Live testnet</Badge>
      ) : isDemo ? (
        <Badge tone="blue">Demo sandbox</Badge>
      ) : (
        <Badge tone="slate">HEALTH + AUTO</Badge>
      )}
    </nav>
  );
}
