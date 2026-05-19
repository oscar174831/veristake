import { Check, Minus, X } from "lucide-react";

type CapabilityStatus = "yes" | "limited" | "no";

const rows: Array<[string, CapabilityStatus, CapabilityStatus, CapabilityStatus, CapabilityStatus, CapabilityStatus]> = [
  ["Human review", "yes", "limited", "limited", "yes", "yes"],
  ["Economic penalties", "yes", "no", "no", "yes", "no"],
  ["Rewards for accurate minority review", "yes", "no", "no", "limited", "no"],
  ["Carrier-friendly", "yes", "limited", "limited", "no", "yes"],
  ["Regulated-friendly", "yes", "limited", "limited", "limited", "yes"],
  ["Privacy-aware", "yes", "limited", "limited", "limited", "limited"]
];

const columns = ["Capability", "Veristake", "Etherisc", "Nexus Mutual", "Kleros", "Status quo"];

const statusCopy: Record<CapabilityStatus, { label: string; className: string; icon: typeof Check }> = {
  yes: {
    label: "Yes",
    className:
      "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100",
    icon: Check
  },
  limited: {
    label: "Limited",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
    icon: Minus
  },
  no: {
    label: "No",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    icon: X
  }
};

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <caption className="sr-only">Comparison of Veristake against alternatives</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map(([label, ...values]) => (
            <tr key={label}>
              <th scope="row" className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-200">
                {label}
              </th>
              {values.map((value, index) => (
                <td key={`${label}-${index}`} className="px-4 py-3">
                  <StatusBadge status={value} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: CapabilityStatus }) {
  const config = statusCopy[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex min-w-20 items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
      aria-label={config.label}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
