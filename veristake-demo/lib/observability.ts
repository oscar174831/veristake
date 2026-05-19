import * as Sentry from "@sentry/nextjs";

function environmentName() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  return site.includes("vercel.app") && !site.includes("preview-") ? "production" : "preview";
}

export function initSentry(runtime: "client" | "server" | "edge") {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (runtime !== "client") {
      console.warn("Sentry disabled: NEXT_PUBLIC_SENTRY_DSN is not configured.");
    }
    return;
  }

  const environment = environmentName();
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === "production" ? 0.2 : 1.0
  });
}
