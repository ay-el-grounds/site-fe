import { config } from "dotenv";

config({ path: ".env.local" });

const PILOT_HANDLES = [
  "greenwichconcours",
  "wekfest_usa",
  "metronypca",
  "porschestimmung",
  "retromobile_nyc",
  "limerockpark",
];
const WEBHOOK_URL =
  process.env.TURNOUT_WEBHOOK_URL ??
  "https://www.aluminumgrounds.co/api/webhooks/apify";
const TERMINAL_RETRIEVAL_STATUSES = new Set([
  "RETRIEVED",
  "PROCESSING",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
]);

async function main() {
  const webhookSecret = process.env.APIFY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("APIFY_WEBHOOK_SECRET is not configured in .env.local");
  }

  const [{ default: prisma }, { ApifyClient }, { startMonitorRun }] =
    await Promise.all([
      import("../src/lib/prisma"),
      import("../src/lib/turnout/apify-client"),
      import("../src/lib/turnout/start-monitor-run"),
    ]);

  const provider = new ApifyClient(process.env.APIFY_API_TOKEN ?? "");
  const started = await startMonitorRun({
    prisma,
    provider,
    handles: PILOT_HANDLES,
    trigger: "MANUAL",
    webhook: {
      requestUrl: WEBHOOK_URL,
      secret: webhookSecret,
    },
  });
  console.log("[Turnout pilot] Started:", started);

  const providerRun = await provider.waitForRun(started.externalRunId);
  console.log(
    `[Turnout pilot] Apify run ${providerRun.id} finished with ${providerRun.status}`
  );

  await waitForRemoteWebhook(prisma, started.runId);
  console.log("[Turnout pilot] Deployed webhook ingestion completed.");

  const replayResponses = await Promise.all([
    replayWebhook(started.externalRunId, webhookSecret),
    replayWebhook(started.externalRunId, webhookSecret),
  ]);
  console.log("[Turnout pilot] Remote replay responses:", replayResponses);

  const verified = await prisma.monitorRun.findUniqueOrThrow({
    where: { id: started.runId },
    include: {
      accounts: {
        include: { account: { select: { handle: true } } },
        orderBy: { providerInputUrl: "asc" },
      },
    },
  });
  const postStatuses = await prisma.instagramPost.groupBy({
    by: ["processingStatus"],
    where: {
      account: {
        monitorRunAccounts: { some: { runId: started.runId } },
      },
      OR: [
        { publishedAt: null },
        { publishedAt: { gte: verified.retrievalWindowStart } },
      ],
    },
    _count: true,
  });

  console.log(
    "[Turnout pilot] Verification:",
    JSON.stringify(
      {
        run: {
          id: verified.id,
          externalRunId: verified.externalRunId,
          datasetId: verified.externalDatasetId,
          status: verified.status,
          accountsRequested: verified.accountsRequested,
          accountsRetrieved: verified.accountsRetrieved,
          postsRetrieved: verified.postsRetrieved,
          postsProcessed: verified.postsProcessed,
          eventsCreated: verified.eventsCreated,
          errorSummary: verified.errorSummary,
        },
        accounts: verified.accounts.map((outcome) => ({
          handle: outcome.account.handle,
          status: outcome.status,
          postsRetrieved: outcome.postsRetrieved,
          needsFallback: outcome.needsFallback,
          fallbackReason: outcome.fallbackReason,
          errorCode: outcome.errorCode,
        })),
        postStatuses,
      },
      null,
      2
    )
  );
}

async function waitForRemoteWebhook(
  prisma: Awaited<typeof import("../src/lib/prisma")>["default"],
  runId: string
): Promise<void> {
  const timeoutAt = Date.now() + 2 * 60 * 1000;
  let stableSince = 0;
  let lastSignature = "";

  while (Date.now() < timeoutAt) {
    const run = await prisma.monitorRun.findUniqueOrThrow({
      where: { id: runId },
      select: {
        status: true,
        externalDatasetId: true,
        postsProcessed: true,
        eventsCreated: true,
        updatedAt: true,
      },
    });
    const signature = JSON.stringify(run);

    if (
      TERMINAL_RETRIEVAL_STATUSES.has(run.status) &&
      run.externalDatasetId &&
      signature === lastSignature
    ) {
      if (!stableSince) stableSince = Date.now();
      if (Date.now() - stableSince >= 15_000) return;
    } else {
      stableSince = 0;
    }

    lastSignature = signature;
    await sleep(3_000);
  }

  throw new Error("Timed out waiting for the deployed webhook to settle");
}

async function replayWebhook(actorRunId: string, secret: string) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      eventType: "ACTOR.RUN.SUCCEEDED",
      eventData: { actorRunId },
      resource: { id: actorRunId },
    }),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main()
  .catch((error) => {
    console.error("[Turnout pilot] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { default: prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
