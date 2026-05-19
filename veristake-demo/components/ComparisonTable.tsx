import { Check, Minus } from "lucide-react";

const rows = [
  ["Human review", true, false, false, true, true],
  ["Economic penalties", true, false, false, true, false],
  ["Rewards for accurate minority review", true, false, false, false, false],
  ["Carrier-friendly", true, false, false, false, true],
  ["Regulated-friendly", true, false, false, false, true],
  ["Privacy-aware", true, true, true, true, false]
] as const;

const columns = ["Capability", "Veristake", "Etherisc", "Nexus Mutual", "Kleros", "Status quo"];

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <caption className="sr-only">Comparison of Veristake against alternatives</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-4 py-3 text-left font-semibold">
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
                  {value ? (
                    <Check className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-label="Yes" />
                  ) : (
                    <Minus className="h-5 w-5 text-slate-400" aria-label="No" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
