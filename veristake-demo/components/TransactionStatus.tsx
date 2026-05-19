import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TransactionStatus({
  title,
  detail,
  wait,
  pending = false,
  txHash,
  explorerBaseUrl = "https://sepolia.basescan.org"
}: {
  title: string;
  detail: string;
  wait: string;
  pending?: boolean;
  txHash?: string;
  explorerBaseUrl?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="mt-0.5">
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-700 dark:text-blue-300" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-teal-700 dark:text-teal-300" aria-hidden="true" />
            )}
          </div>
          <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
          </div>
        </div>
        <Badge tone="blue">{wait}</Badge>
      </div>
      {txHash ? (
        <a
          href={`${explorerBaseUrl}/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="focus-ring mt-3 inline-flex items-center gap-1 rounded-md text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-300"
        >
          View on explorer
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}
