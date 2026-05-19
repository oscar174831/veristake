import { NextResponse } from "next/server";
import type { Address } from "viem";
import { createDemoSession, getDemoSession } from "@/lib/demoOrchestrator";
import type { Domain, Persona } from "@/lib/scenarios";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    persona?: Persona;
    domain?: Domain;
    walletAddress?: Address;
  };

  if (!body.persona || !["carrier", "claimant", "verifier"].includes(body.persona)) {
    return NextResponse.json({ error: "A valid persona is required." }, { status: 400 });
  }

  const session = await createDemoSession({
    persona: body.persona,
    domain: body.domain,
    walletAddress: body.walletAddress
  });

  return NextResponse.json(session);
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Session id is required." }, { status: 400 });
  const session = await getDemoSession(id);
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  return NextResponse.json(session);
}
