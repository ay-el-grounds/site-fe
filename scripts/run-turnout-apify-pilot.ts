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

async function main() {
  const [{ default: prisma }, { ApifyClient }, { startMonitorRun }, ingestion, classification] =
    await Promise.all([
      import("../src/lib/prisma"),
      import("../src/lib/turnout/apify-client"),
      import("../src/lib/turnout/start-monitor-run"),
      import("../src/lib/turnout/ingest-apify-run"),
      import("../src/lib/turnout/classify-pending"),
    ]);

  const provider = new ApifyClient(process.env.APIFY_API_TOKEN ?? "");
  const started = await startMonitorRun({
    prisma,
    provider,
    handles: PILOT_HANDLES,
    trigger: "MANUAL",
  });
  console.log("[Turnout pilot] Started:", started);

  const providerRun = await provider.waitForRun(started.externalRunId);
  console.log(
    `[Turnout pilot] Apify run ${providerRun.id} finished with ${providerRun.status}`
  );

  const ingested = await ingestion.ingestApifyRun({
    prisma,
    provider,
    callbackRunId: started.externalRunId,
  });
  console.log("[Turnout pilot] Ingestion:", ingested);

  const classified =
    ingested.status === "FAILED"
      ? null
      : await classification.classifyPendingPosts({
          prisma,
          runId: started.runId,
          limit: 3,
        });
  console.log("[Turnout pilot] Classification:", classified);

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

main()
  .catch((error) => {
    console.error("[Turnout pilot] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { default: prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
