import { NextResponse } from "next/server";
import { getProtocolMetrics } from "@/lib/contractReads";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = await getProtocolMetrics();
  return NextResponse.json(metrics);
}
