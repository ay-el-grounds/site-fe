/**
 * Vercel Cron Job endpoint — runs the Instagram monitor automatically.
 *
 * Vercel sends a GET request to this endpoint on schedule (see vercel.json).
 * It injects an Authorization header with the CRON_SECRET env var.
 *
 * Set up in vercel.json:
 * {
 *   "crons": [{ "path": "/api/cron/monitor", "schedule": "0 8 * * *" }]
 * }
 *
 * Required env var: CRON_SECRET (set in Vercel dashboard)
 */

import { NextRequest, NextResponse } from "next/server";
import { runMonitor } from "@/lib/instagram-monitor";

// Hobby-compatible ceiling. Longer monitor runs should use the standalone script.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify Vercel's injected authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron] Starting scheduled Instagram monitor run...");

  try {
    const summary = await runMonitor();

    console.log("[cron] Monitor run complete:", summary);

    return NextResponse.json({
      success: true,
      summary,
      runAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron] Monitor run failed:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
