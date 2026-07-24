-- CreateEnum
CREATE TYPE "MonitorRunStatus" AS ENUM ('PENDING', 'RETRIEVING', 'RETRIEVED', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "MonitorRunTrigger" AS ENUM ('SCHEDULED', 'MANUAL', 'RECONCILIATION', 'HISTORICAL_BACKFILL');

-- CreateEnum
CREATE TYPE "MonitorRunAccountStatus" AS ENUM ('PENDING', 'RETRIEVED', 'EMPTY', 'FALLBACK_REQUIRED', 'NOT_FOUND', 'PRIVATE', 'FAILED');

-- CreateEnum
CREATE TYPE "MonitorRetrievalSource" AS ENUM ('DETAILS_PRIMARY', 'POSTS_FALLBACK', 'HISTORICAL_BACKFILL');

-- CreateEnum
CREATE TYPE "InstagramPostProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'NON_EVENT', 'EVENT_CREATED', 'RETRYABLE_ERROR', 'PERMANENT_ERROR');

-- AlterTable
ALTER TABLE "watched_accounts" ADD COLUMN     "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "lastProcessedAt" TIMESTAMP(3),
ADD COLUMN     "lastRetrievalError" TEXT,
ADD COLUMN     "lastRetrievedAt" TIMESTAMP(3),
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN     "providerAccountId" TEXT,
ADD COLUMN     "retrievalStatus" TEXT;

-- CreateTable
CREATE TABLE "monitor_runs" (
    "id" TEXT NOT NULL,
    "status" "MonitorRunStatus" NOT NULL DEFAULT 'PENDING',
    "trigger" "MonitorRunTrigger" NOT NULL DEFAULT 'SCHEDULED',
    "provider" TEXT NOT NULL DEFAULT 'apify',
    "externalRunId" TEXT,
    "externalDatasetId" TEXT,
    "providerSchemaVersion" TEXT,
    "retrievalWindowStart" TIMESTAMP(3) NOT NULL,
    "retrievalWindowEnd" TIMESTAMP(3) NOT NULL,
    "accountsRequested" INTEGER NOT NULL,
    "accountsRetrieved" INTEGER NOT NULL DEFAULT 0,
    "postsRetrieved" INTEGER NOT NULL DEFAULT 0,
    "postsProcessed" INTEGER NOT NULL DEFAULT 0,
    "eventsCreated" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retrievedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitor_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitor_run_accounts" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "MonitorRunAccountStatus" NOT NULL DEFAULT 'PENDING',
    "retrievalSource" "MonitorRetrievalSource" NOT NULL DEFAULT 'DETAILS_PRIMARY',
    "providerInputUrl" TEXT NOT NULL,
    "providerAccountId" TEXT,
    "postsRetrieved" INTEGER NOT NULL DEFAULT 0,
    "needsFallback" BOOLEAN NOT NULL DEFAULT false,
    "fallbackReason" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "monitor_run_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_posts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerPostId" TEXT,
    "shortcode" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "caption" TEXT,
    "publishedAt" TIMESTAMP(3),
    "mediaUrl" TEXT,
    "media" JSONB,
    "providerSchemaVersion" TEXT NOT NULL,
    "providerDatasetId" TEXT,
    "processingStatus" "InstagramPostProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "classifierVersion" TEXT,
    "classification" JSONB,
    "processingAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastProcessingError" TEXT,
    "processingLeaseId" TEXT,
    "processingLeaseExpiresAt" TIMESTAMP(3),
    "eventId" TEXT,
    "firstRetrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRetrievedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monitor_runs_externalRunId_key" ON "monitor_runs"("externalRunId");

-- CreateIndex
CREATE INDEX "monitor_runs_status_createdAt_idx" ON "monitor_runs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "monitor_runs_externalDatasetId_idx" ON "monitor_runs"("externalDatasetId");

-- CreateIndex
CREATE INDEX "monitor_run_accounts_runId_status_idx" ON "monitor_run_accounts"("runId", "status");

-- CreateIndex
CREATE INDEX "monitor_run_accounts_accountId_startedAt_idx" ON "monitor_run_accounts"("accountId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "monitor_run_accounts_runId_accountId_key" ON "monitor_run_accounts"("runId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_posts_eventId_key" ON "instagram_posts"("eventId");

-- CreateIndex
CREATE INDEX "instagram_posts_processingStatus_idx" ON "instagram_posts"("processingStatus");

-- CreateIndex
CREATE INDEX "instagram_posts_processingLeaseExpiresAt_idx" ON "instagram_posts"("processingLeaseExpiresAt");

-- CreateIndex
CREATE INDEX "instagram_posts_publishedAt_idx" ON "instagram_posts"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_posts_accountId_shortcode_key" ON "instagram_posts"("accountId", "shortcode");

-- CreateIndex
CREATE INDEX "watched_accounts_nextAttemptAt_idx" ON "watched_accounts"("nextAttemptAt");

-- AddForeignKey
ALTER TABLE "monitor_run_accounts" ADD CONSTRAINT "monitor_run_accounts_runId_fkey" FOREIGN KEY ("runId") REFERENCES "monitor_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitor_run_accounts" ADD CONSTRAINT "monitor_run_accounts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "watched_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_posts" ADD CONSTRAINT "instagram_posts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "watched_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_posts" ADD CONSTRAINT "instagram_posts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
