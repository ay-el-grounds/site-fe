import { randomUUID } from "node:crypto";
import {
  InstagramPostProcessingStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import {
  extractEventFromPost,
  parseTurnoutDateTime,
  type ExtractedEvent,
  type RawPost,
} from "@/lib/instagram-monitor";

const CLASSIFIER_VERSION = "turnout-gpt4o-mini-v2";
const DEFAULT_BATCH_SIZE = 3;
const MAX_ATTEMPTS = 3;
const LEASE_MINUTES = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

interface ClaimedPost {
  id: string;
  accountId: string;
  providerPostId: string | null;
  shortcode: string;
  canonicalUrl: string;
  caption: string | null;
  publishedAt: Date | null;
  mediaUrl: string | null;
  handle: string;
  processingAttempts: number;
}

export type PostClassifier = (
  post: RawPost,
  handle: string
) => Promise<ExtractedEvent | null>;

export interface ClassifyPendingOptions {
  prisma: PrismaClient;
  runId: string;
  limit?: number;
  now?: Date;
  classifier?: PostClassifier;
}

export interface ClassificationSummary {
  claimed: number;
  processed: number;
  eventsCreated: number;
  retryableErrors: number;
}

export async function classifyPendingPosts(
  options: ClassifyPendingOptions
): Promise<ClassificationSummary> {
  const now = options.now ?? new Date();
  const leaseId = randomUUID();
  const leaseExpiresAt = new Date(now.getTime() + LEASE_MINUTES * 60 * 1000);
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_BATCH_SIZE, 10));
  const classifier =
    options.classifier ??
    ((post, handle) =>
      extractEventFromPost(post, handle, { throwOnProviderError: true }));

  const claimed = await options.prisma.$transaction((tx) =>
    claimPendingPosts(tx, {
      runId: options.runId,
      leaseId,
      leaseExpiresAt,
      now,
      limit,
    })
  );

  const summary: ClassificationSummary = {
    claimed: claimed.length,
    processed: 0,
    eventsCreated: 0,
    retryableErrors: 0,
  };

  for (const post of claimed) {
    try {
      const extracted = await classifier(toRawPost(post), post.handle);
      const result = await persistClassification(
        options.prisma,
        options.runId,
        post,
        leaseId,
        extracted,
        now
      );
      summary.processed += result.processed;
      summary.eventsCreated += result.eventsCreated;
    } catch (error) {
      summary.retryableErrors++;
      await releaseWithError(
        options.prisma,
        post.id,
        leaseId,
        post.processingAttempts,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  await settleRunProcessing(options.prisma, options.runId, now);
  return summary;
}

async function claimPendingPosts(
  tx: Prisma.TransactionClient,
  options: {
    runId: string;
    leaseId: string;
    leaseExpiresAt: Date;
    now: Date;
    limit: number;
  }
): Promise<ClaimedPost[]> {
  return tx.$queryRaw<ClaimedPost[]>`
    WITH candidates AS (
      SELECT p.id
      FROM "instagram_posts" p
      INNER JOIN "monitor_run_accounts" mra
        ON mra."accountId" = p."accountId"
      INNER JOIN "monitor_runs" mr
        ON mr.id = mra."runId"
      WHERE mra."runId" = ${options.runId}
        AND (p."publishedAt" IS NULL OR p."publishedAt" >= mr."retrievalWindowStart")
        AND (
          p."processingStatus" = 'PENDING'::"InstagramPostProcessingStatus"
          OR (
            p."processingStatus" = 'RETRYABLE_ERROR'::"InstagramPostProcessingStatus"
            AND p."processingAttempts" < ${MAX_ATTEMPTS}
          )
          OR (
            p."processingStatus" = 'PROCESSING'::"InstagramPostProcessingStatus"
            AND p."processingLeaseExpiresAt" < ${options.now}
          )
        )
      ORDER BY p.id
      FOR UPDATE OF p SKIP LOCKED
      LIMIT ${options.limit}
    )
    UPDATE "instagram_posts" p
    SET
      "processingStatus" = 'PROCESSING'::"InstagramPostProcessingStatus",
      "processingLeaseId" = ${options.leaseId},
      "processingLeaseExpiresAt" = ${options.leaseExpiresAt},
      "processingAttempts" = p."processingAttempts" + 1
    FROM candidates c, "watched_accounts" a
    WHERE p.id = c.id
      AND a.id = p."accountId"
    RETURNING
      p.id,
      p."accountId",
      p."providerPostId",
      p.shortcode,
      p."canonicalUrl",
      p.caption,
      p."publishedAt",
      p."mediaUrl",
      a.handle,
      p."processingAttempts"
  `;
}

async function persistClassification(
  prisma: PrismaClient,
  runId: string,
  post: ClaimedPost,
  leaseId: string,
  extracted: ExtractedEvent | null,
  now: Date
): Promise<{ processed: number; eventsCreated: number }> {
  return prisma.$transaction(async (tx) => {
    const leasedPost = await tx.instagramPost.findFirst({
      where: { id: post.id, processingLeaseId: leaseId },
      select: { id: true },
    });
    if (!leasedPost) return { processed: 0, eventsCreated: 0 };

    if (!extracted) {
      await completePost(tx, post.id, leaseId, "NON_EVENT", null, null);
      await recordProcessedPost(tx, runId, post.accountId, false, now);
      return { processed: 1, eventsCreated: 0 };
    }

    const eventDate = parseTurnoutDateTime(extracted.date);
    const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
    if (Number.isNaN(eventDate.getTime()) || eventDate < sevenDaysAgo) {
      await completePost(tx, post.id, leaseId, "NON_EVENT", extracted, null);
      await recordProcessedPost(tx, runId, post.accountId, false, now);
      return { processed: 1, eventsCreated: 0 };
    }

    const dayStart = new Date(eventDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);

    const existingBySource = await tx.event.findFirst({
      where: { instagramPostUrl: post.canonicalUrl },
      select: { id: true },
    });
    const sameDayCandidates = await tx.event.findMany({
      where: {
        sourceAccount: post.handle,
        date: { gte: dayStart, lt: dayEnd },
      },
      select: { id: true, title: true, city: true },
    });
    const duplicate =
      existingBySource ??
      sameDayCandidates.find(
        (candidate) =>
          normalizePlace(candidate.city) === normalizePlace(extracted.city) &&
          titlesLikelyMatch(candidate.title, extracted.title)
      );

    if (duplicate) {
      await completePost(tx, post.id, leaseId, "NON_EVENT", extracted, null);
      await recordProcessedPost(tx, runId, post.accountId, false, now);
      return { processed: 1, eventsCreated: 0 };
    }

    const created = await tx.event.create({
      data: {
        title: extracted.title,
        description: extracted.description,
        date: eventDate,
        endTime: extracted.endTime
          ? parseTurnoutDateTime(extracted.endTime)
          : null,
        venue: extracted.venue,
        address: extracted.address,
        city: extracted.city,
        state: extracted.state,
        categories: extracted.categories,
        ticketUrl: extracted.ticketUrl,
        imageUrl: post.mediaUrl,
        instagramPostUrl: post.canonicalUrl,
        sourceAccount: post.handle,
        status: "approved",
        isUserSubmitted: false,
      },
      select: { id: true },
    });

    await completePost(
      tx,
      post.id,
      leaseId,
      "EVENT_CREATED",
      extracted,
      created.id
    );
    await recordProcessedPost(tx, runId, post.accountId, true, now);
    return { processed: 1, eventsCreated: 1 };
  });
}

function normalizePlace(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bnyc\b|\bnew york city\b/g, "new york")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function titlesLikelyMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizePlace(left);
  const normalizedRight = normalizePlace(right);
  if (normalizedLeft === normalizedRight) return true;

  const shorter =
    normalizedLeft.length <= normalizedRight.length
      ? normalizedLeft
      : normalizedRight;
  const longer =
    normalizedLeft.length > normalizedRight.length
      ? normalizedLeft
      : normalizedRight;
  return shorter.length >= 12 && longer.includes(shorter);
}

async function completePost(
  tx: Prisma.TransactionClient,
  postId: string,
  leaseId: string,
  status: InstagramPostProcessingStatus,
  classification: ExtractedEvent | null,
  eventId: string | null
): Promise<void> {
  await tx.instagramPost.updateMany({
    where: { id: postId, processingLeaseId: leaseId },
    data: {
      processingStatus: status,
      classifierVersion: CLASSIFIER_VERSION,
      classification: classification
        ? (classification as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      eventId,
      lastProcessingError: null,
      processingLeaseId: null,
      processingLeaseExpiresAt: null,
    },
  });
}

async function recordProcessedPost(
  tx: Prisma.TransactionClient,
  runId: string,
  accountId: string,
  eventCreated: boolean,
  now: Date
): Promise<void> {
  await tx.monitorRun.update({
    where: { id: runId },
    data: {
      postsProcessed: { increment: 1 },
      eventsCreated: eventCreated ? { increment: 1 } : undefined,
    },
  });
  await tx.watchedAccount.update({
    where: { id: accountId },
    data: { lastProcessedAt: now },
  });
}

async function releaseWithError(
  prisma: PrismaClient,
  postId: string,
  leaseId: string,
  processingAttempts: number,
  message: string
): Promise<void> {
  await prisma.instagramPost.updateMany({
    where: { id: postId, processingLeaseId: leaseId },
    data: {
      processingStatus:
        processingAttempts >= MAX_ATTEMPTS
          ? "PERMANENT_ERROR"
          : "RETRYABLE_ERROR",
      lastProcessingError: message.slice(0, 2000),
      processingLeaseId: null,
      processingLeaseExpiresAt: null,
    },
  });
}

async function settleRunProcessing(
  prisma: PrismaClient,
  runId: string,
  now: Date
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const run = await tx.monitorRun.findUniqueOrThrow({
      where: { id: runId },
      select: { status: true, retrievalWindowStart: true },
    });
    if (run.status !== "RETRIEVED" && run.status !== "PROCESSING") return;

    const remaining = await tx.instagramPost.count({
      where: {
        account: { monitorRunAccounts: { some: { runId } } },
        OR: [
          { publishedAt: null },
          { publishedAt: { gte: run.retrievalWindowStart } },
        ],
        AND: [
          {
            OR: [
              { processingStatus: "PENDING" },
              { processingStatus: "PROCESSING" },
              {
                processingStatus: "RETRYABLE_ERROR",
                processingAttempts: { lt: MAX_ATTEMPTS },
              },
            ],
          },
        ],
      },
    });

    await tx.monitorRun.update({
      where: { id: runId },
      data:
        remaining === 0
          ? { status: "COMPLETED", completedAt: now }
          : { status: "PROCESSING" },
    });
  });
}

function toRawPost(post: ClaimedPost): RawPost {
  return {
    id: post.providerPostId ?? post.id,
    caption: post.caption ?? "",
    timestamp: post.publishedAt?.toISOString() ?? new Date().toISOString(),
    mediaUrl: post.mediaUrl,
    postUrl: post.canonicalUrl,
    shortcode: post.shortcode,
  };
}
