"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourceChip } from "@/components/SourceChip";
import { trackEvent } from "@/lib/analytics";

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStartedRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [completedTracked, setCompletedTracked] = useState(false);
  const [videoError, setVideoError] = useState(false);

  async function playWithSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    video.loop = false;
    try {
      await video.play();
      setSoundEnabled(true);
      if (!videoStartedRef.current) {
        trackEvent("video_started");
        videoStartedRef.current = true;
      }
    } catch {
      setVideoError(true);
    }
  }

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <div className="max-w-2xl">
          <p
            className="font-display font-semibold leading-none tracking-normal text-[#0B2545] dark:text-white"
            style={{ fontSize: "clamp(72px, 9vw, 144px)" }}
          >
            80.7%
          </p>
          <h1 className="mt-5 text-lg font-semibold leading-8 text-slate-800 dark:text-slate-100">
            of appealed Medicare Advantage denials were overturned in 2024.
          </h1>
          <SourceChip statKey="MA_PRIOR_AUTH_OVERTURN_RATE_2024" />
          <p className="mt-8 text-xl leading-8 text-slate-700 dark:text-slate-200">
            Veristake is the verification layer that catches the denials that shouldn&apos;t have
            happened - and the fraud you shouldn&apos;t have paid.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" prefetch={false} onClick={() => trackEvent("cta_clicked", { cta_id: "hero_try_demo" })}>
              <Button size="lg">
                Try the 3-minute demo
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            <Link
              href="/#for-carriers"
              prefetch={false}
              onClick={() => trackEvent("cta_clicked", { cta_id: "hero_carrier_integrate" })}
            >
              <Button size="lg" variant="secondary">
                How carriers integrate
              </Button>
            </Link>
          </div>
        </div>

        <div className="w-full pt-40 sm:pt-0">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-panel dark:border-slate-800">
            {!videoError ? (
              <video
                ref={videoRef}
                poster="/videos/highlight-poster.jpg"
                preload="metadata"
                autoPlay
                muted
                loop
                playsInline
                controls={soundEnabled}
                controlsList="nodownload noplaybackrate"
                aria-label="Narrated Veristake walkthrough video"
                className="aspect-video max-h-[540px] w-full object-cover"
                onError={() => setVideoError(true)}
                onPlay={() => {
                  if (!videoStartedRef.current && soundEnabled) {
                    trackEvent("video_started");
                    videoStartedRef.current = true;
                  }
                }}
                onEnded={() => {
                  if (!completedTracked) {
                    trackEvent("video_completed");
                    setCompletedTracked(true);
                  }
                }}
              >
                <source src="/videos/highlight-reel-90s.webm" type="video/webm" />
                <source src="/videos/highlight-reel-90s.mp4" type="video/mp4" />
                <track
                  kind="captions"
                  src="/videos/highlight-reel-90s.vtt"
                  srcLang="en"
                  label="English captions"
                  default
                />
                Your browser cannot play this walkthrough video.
              </video>
            ) : (
              <div className="flex aspect-video max-h-[540px] w-full flex-col items-center justify-center gap-3 p-8 text-center text-white">
                <p className="text-base font-semibold">Video preview unavailable</p>
                <p className="max-w-md text-sm text-slate-300">
                  The demo still works in the browser. Open the walkthrough asset directly if your
                  network blocks embedded video playback.
                </p>
                <a
                  href="/videos/highlight-reel-90s.mp4"
                  className="focus-ring rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Open walkthrough
                </a>
              </div>
            )}
            {!soundEnabled && !videoError ? (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-slate-950/72 p-4 text-white backdrop-blur">
                <p className="text-sm font-medium">Narrated walkthrough. Click for sound.</p>
                <Button type="button" size="sm" variant="secondary" onClick={playWithSound}>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  Play sound
                </Button>
              </div>
            ) : null}
          </div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Narrated walkthrough. Click for sound.
          </p>
        </div>
      </div>
    </section>
  );
}
