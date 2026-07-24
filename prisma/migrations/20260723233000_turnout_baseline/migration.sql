-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "venue" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "categories" TEXT[],
    "ticketUrl" TEXT,
    "imageUrl" TEXT,
    "instagramPostUrl" TEXT,
    "sourceAccount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'approved',
    "submittedByName" TEXT,
    "submittedByEmail" TEXT,
    "verificationLink" TEXT,
    "isUserSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_logs" (
    "id" TEXT NOT NULL,
    "accountHandle" TEXT NOT NULL,
    "postsChecked" INTEGER NOT NULL,
    "eventsFound" INTEGER NOT NULL,
    "eventsAdded" INTEGER NOT NULL,
    "errors" TEXT,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrape_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watched_accounts" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watched_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "watched_accounts_handle_key" ON "watched_accounts"("handle" ASC);
