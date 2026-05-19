import { NextResponse } from "next/server";
import type { Address } from "viem";
import { dripFaucet } from "@/lib/demoOrchestrator";
import { getSessionStore } from "@/lib/sessionStore";

function limitFromEnv(name: string, fallback: number) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function utcHourBucket(now: Date) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(
    now.getUTCDate()
  ).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}`;
}

function utcDayBucket(now: Date) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(
    now.getUTCDate()
  ).padStart(2, "0")}`;
}

function secondsUntilNextUtcHour(now: Date) {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours() + 1,
    0,
    0,
    0
  );
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

function secondsUntilNextUtcDay(now: Date) {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

function rateLimited(message: string, retryAfterSeconds: number) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const now = new Date();
  const hourlyLimit = limitFromEnv("FAUCET_RATE_LIMIT_PER_HOUR", 5);
  const dailyLimit = limitFromEnv("FAUCET_DAILY_CAP", 25);
  const store = getSessionStore();

  const hourKey = `faucet:${ip}:${utcHourBucket(now)}`;
  const dayKey = `faucet:${ip}:${utcDayBucket(now)}`;
  const [hourlyCount, dailyCount] = await Promise.all([
    store.incrementCounter(hourKey, secondsUntilNextUtcHour(now)),
    store.incrementCounter(dayKey, secondsUntilNextUtcDay(now))
  ]);

  if (dailyCount > dailyLimit) {
    return rateLimited(
      "Demo faucet daily limit reached for this visitor. Please try again tomorrow.",
      secondsUntilNextUtcDay(now)
    );
  }

  if (hourlyCount > hourlyLimit) {
    return rateLimited(
      "Demo faucet hourly limit reached for this visitor. Please try again later.",
      secondsUntilNextUtcHour(now)
    );
  }

  const body = (await request.json().catch(() => ({}))) as { address?: Address };
  if (!body.address || !body.address.startsWith("0x")) {
    return NextResponse.json({ error: "A sandbox wallet address is required." }, { status: 400 });
  }

  const result = await dripFaucet(body.address);
  return NextResponse.json(result);
}
