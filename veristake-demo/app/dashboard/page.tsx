import { DashboardView } from "@/components/DashboardView";
import { QueryProvider } from "@/app/query-provider";
import { hasConfiguredAddresses } from "@/lib/contracts";

export default function DashboardPage() {
  const configured = hasConfiguredAddresses("production");

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <QueryProvider>
          <DashboardView configured={configured} />
        </QueryProvider>
      </div>
    </section>
  );
}
