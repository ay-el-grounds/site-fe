/**
 * Admin API: POST /api/admin/monitor
 *
 * Manually triggers an Instagram monitoring run.
 * In production this is called automatically by a Vercel Cron Job every 24h,
 * but this endpoint lets you trigger it on demand.
 *
 * Protected with x-admin-key header.
 *
 * Response: { success: true, summary: MonitorSummary }
 *
 * Note: This can take several minutes to complete (30 accounts × network requests
 * × OpenAI calls). Vercel's default function timeout is 10s on Hobby / 60s on Pro.
 * For long runs, consider using Vercel's maxDuration config or running via cron
 * with the standalone script instead.
 */

import { NextRequest, NextResponse } from "next/server";
import { runMonitor } from "@/lib/instagram-monitor";

/** Validate the admin key header */
function isAuthorized(request: NextRequest): boolean {
  const key = request.headers.get("x-admin-key");
  return !!key && key === process.env.ADMIN_SECRET_KEY;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-admin-key header." },
      { status: 401 }
    );
  }

  try {
    console.log("[POST /api/admin/monitor] Starting monitor run...");
    const summary = await runMonitor();

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err) {
    console.error("[POST /api/admin/monitor] Fatal error:", err);
    return NextResponse.json(
      {
        error: "Monitor run failed.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// Extend the function timeout for this route (Vercel Pro allows up to 300s)
// See: https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 300;
