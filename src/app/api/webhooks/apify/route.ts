import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { ApifyClient } from "@/lib/turnout/apify-client";
import {
  authenticateApifyWebhook,
  parseApifyWebhookPayload,
} from "@/lib/turnout/apify-webhook";
import {
  classifyPendingPosts,
  type ClassificationSummary,
} from "@/lib/turnout/classify-pending";
import {
  ingestApifyRun,
  UnknownMonitorRunError,
} from "@/lib/turnout/ingest-apify-run";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (
    !authenticateApifyWebhook(
      request.headers.get("authorization"),
      process.env.APIFY_WEBHOOK_SECRET
    )
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let callbackRunId: string;
  try {
    callbackRunId = parseApifyWebhookPayload(await request.json()).actorRunId;
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid Apify webhook payload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }

  try {
    const provider = new ApifyClient(process.env.APIFY_API_TOKEN ?? "");
    const ingestion = await ingestApifyRun({
      prisma,
      provider,
      callbackRunId,
    });

    if (ingestion.disposition === "in_progress") {
      return NextResponse.json(
        {
          accepted: true,
          disposition: ingestion.disposition,
          runId: ingestion.runId,
        },
        { status: 202 }
      );
    }

    let classification: ClassificationSummary | null = null;
    if (ingestion.disposition === "ingested" && ingestion.status !== "FAILED") {
      classification = await classifyPendingPosts({
        prisma,
        runId: ingestion.runId,
        limit: 3,
      });
    }

    return NextResponse.json({
      accepted: true,
      ingestion,
      classification,
    });
  } catch (error) {
    if (error instanceof UnknownMonitorRunError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("[Turnout Apify webhook] Ingestion failed:", error);
    return NextResponse.json(
      {
        error: "Webhook ingestion failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
