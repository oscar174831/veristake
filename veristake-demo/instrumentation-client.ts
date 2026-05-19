import { initSentry } from "./lib/observability";
import * as Sentry from "@sentry/nextjs";

initSentry("client");

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
