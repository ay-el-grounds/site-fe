import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ApifyClient } from "@/lib/turnout/apify-client";
import { reconcileTurnout } from "@/lib/turnout/reconcile";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid x-admin-key header." },
      { status: 401 }
    );
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
    const summary = await reconcileTurnout({
      prisma,
      provider,
      webhook: {
        requestUrl:
          process.env.TURNOUT_WEBHOOK_URL ??
          new URL("/api/webhooks/apify", request.nextUrl.origin).toString(),
        secret: webhookSecret,
      },
    });

    return NextResponse.json(summary, { status: summary.accepted ? 200 : 202 });
  } catch (error) {
    console.error("[Turnout reconciliation] Failed:", error);
    return NextResponse.json(
      {
        error: "Turnout reconciliation failed.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
