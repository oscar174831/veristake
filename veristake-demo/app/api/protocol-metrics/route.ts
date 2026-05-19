import { NextResponse } from "next/server";
import { getProtocolMetrics } from "@/lib/contractReads";
import type { MetricsTimeframe } from "@/lib/protocolMetrics";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("timeframe");
  const timeframe: MetricsTimeframe = raw === "24h" || raw === "7d" || raw === "all" ? raw : "all";
  const metrics = await getProtocolMetrics(timeframe);
  return NextResponse.json(metrics, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
