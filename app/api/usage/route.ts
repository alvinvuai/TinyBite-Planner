import { NextRequest, NextResponse } from "next/server";
import { toUsageSummary } from "@/lib/cost";
import { getUsageStore } from "@/lib/usageStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const provided = request.headers.get("x-admin-secret") || request.nextUrl.searchParams.get("secret");
  if (!process.env.ADMIN_SECRET || provided !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const usage = await getUsageStore().get();
  return NextResponse.json({
    ...usage,
    summary: toUsageSummary(usage.estimatedUsd),
    storageWarning: process.env.VERCEL
      ? "Usage storage is in-memory on Vercel for v1. Add Upstash Redis, Vercel KV, Supabase, or Postgres for persistence."
      : undefined,
  });
}
