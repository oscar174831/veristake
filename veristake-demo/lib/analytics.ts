"use client";

export type AnalyticsEvent =
  | "landing_viewed"
  | "cta_clicked"
  | "demo_persona_selected"
  | "demo_step_completed"
  | "demo_completed"
  | "demo_dropoff"
  | "source_chip_clicked"
  | "video_started"
  | "video_completed";

declare global {
  interface Window {
    plausible?: (event: AnalyticsEvent, options?: { props?: Record<string, string | number> }) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, props?: Record<string, string | number>) {
  if (typeof window === "undefined" || !window.plausible) return;
  window.plausible(event, props ? { props } : undefined);
}
