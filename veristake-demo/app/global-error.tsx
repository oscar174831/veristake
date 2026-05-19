"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-5 px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Veristake</p>
          <h1 className="text-3xl font-display text-slate-950">Something did not load cleanly.</h1>
          <p className="text-slate-600">
            The issue has been captured for review. You can retry the page without losing your place in the demo.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
