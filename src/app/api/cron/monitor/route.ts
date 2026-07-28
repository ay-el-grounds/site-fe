import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ApifyClient } from "@/lib/turnout/apify-client";
import {
  isAuthorizedCronRequest,
  runScheduledTurnout,
} from "@/lib/turnout/scheduled-monitor";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (
    !isAuthorizedCronRequest(
      request.headers.get("authorization"),
      process.env.CRON_SECRET
    )
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "APIFY_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  try {
    const provider = new ApifyClient(process.env.APIFY_API_TOKEN ?? "");
    const summary = await runScheduledTurnout({
      prisma,
      provider,
      webhook: {
        requestUrl:
          process.env.TURNOUT_WEBHOOK_URL ??
          new URL("/api/webhooks/apify", request.nextUrl.origin).toString(),
        secret: webhookSecret,
      },
    });

    console.log("[Turnout cron] Scheduled workflow accepted:", summary);

    return NextResponse.json({
      success: true,
      summary,
      runAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Turnout cron] Scheduled workflow failed:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
