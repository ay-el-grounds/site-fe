# Turnout Provider Workflow Plan

Last updated: 2026-07-24

## Status

Turnout's Apify retrieval and webhook ingestion path is live and proven. It
must not replace the legacy daily monitor until reconciliation can recover and
drain all durable work.

Current operating rule:

- Keep the deployed Apify webhook enabled.
- Keep the legacy `/api/cron/monitor` job enabled.
- Do not add an Apify schedule to `vercel.json` yet.
- Do not disable the legacy monitor until every activation gate in this file
  is complete.

## Current Production Snapshot

Captured from Neon at `2026-07-24T02:16:22.232Z`:

| Item | Count |
| --- | ---: |
| Active watched accounts | 32 |
| Durable Instagram posts | 72 |
| Pending classifications | 67 |
| Non-event classifications | 5 |
| Event-created classifications | 0 |
| Runs in `PROCESSING` | 1 |
| Runs in `PARTIAL` | 1 |
| Historical account outcomes requiring fallback | 2 |

The pending count includes posts retained for durable processing, including
posts outside a run's current retrieval window. Reconciliation must select work
using the run window and lease rules rather than treating the global pending
count as a single undifferentiated queue.

## Original Failure

The legacy monitor retrieves Instagram profile HTML and undocumented Instagram
JSON directly inside one long-running function. This creates several failure
modes:

- Instagram can block or change the response format.
- One function performs retrieval, classification, and event insertion.
- Work that exceeds the function duration is lost rather than resumed.
- There is no durable post queue.
- There is no account-level provider outcome for a specific run.
- Missed days and partial batches cannot be reconciled safely.

The repair separates retrieval from classification and persists every unit of
work before asking GPT to classify it.

## Target Workflow

```text
Daily Turnout trigger
  -> create MonitorRun and requested account outcomes
  -> start one Apify details batch with an authenticated ad-hoc webhook
  -> return immediately

Apify completion webhook
  -> authenticate bearer secret
  -> resolve the stored provider run ID
  -> fetch the authoritative run and dataset outside the transaction
  -> atomically persist account outcomes and posts
  -> mark fallback requirements
  -> classify one bounded leased batch
  -> return

Daily/manual reconciliation
  -> recover terminal provider runs whose callback was missed
  -> recover expired classification leases
  -> launch unresolved posts fallbacks
  -> ingest completed fallback datasets
  -> classify bounded pending batches within a time budget
  -> finalize completed, partial, failed, and stale runs
```

## Non-Negotiable Invariants

1. Callback dataset identifiers are never trusted. Dataset IDs come from the
   provider run fetched using `MonitorRun.externalRunId`.
2. Provider network work happens outside database transactions.
3. Retrieval is successful only after account outcomes and posts commit
   atomically.
4. Retrieval status and classification status remain separate.
5. Webhook replay never duplicates posts, account outcomes, classifications,
   or events.
6. A concurrent duplicate callback receives an accepted/idempotent response.
7. Existing posts are updated with refreshed provider metadata without
   resetting terminal classification.
8. Collaborative posts remain owned by the requested watched account.
9. Classification work is leased, bounded, retryable, and reclaimable.
10. The legacy cron remains the production fallback until the new workflow is
    proven across all 32 accounts.

## Completed Work

### Gate 1: Provider Pilot

Status: Complete

- Selected the official `apify/instagram-scraper` Actor.
- Piloted `details`, `posts`, and `reels` against six accounts.
- Confirmed `details.latestPosts` covers normal feed and reel ingestion.
- Confirmed account and post identity fields.
- Adopted a minimum three-day overlap with expansion after missed runs.
- Added fixture-backed details parsing and fallback detection.
- Parser version: `apify-details-v1`.

Pilot accounts:

- `greenwichconcours`
- `limerockpark`
- `metronypca`
- `porschestimmung`
- `retromobile_nyc`
- `wekfest_usa`

### Gate 2: Durable Schema

Status: Complete

- Added `MonitorRun`.
- Added `MonitorRunAccount`.
- Added `InstagramPost`.
- Added account retrieval health fields.
- Preserved legacy `lastCheckedAt`.
- Added required uniqueness constraints and queue indexes.
- Applied reviewed Prisma migrations directly to Neon.
- Verified preservation counts, rollback behavior, cascade behavior, and zero
  schema drift.

### Gate 3: Webhook Ingestion

Status: Complete

- Added `POST /api/webhooks/apify`.
- Added bearer authentication using `APIFY_WEBHOOK_SECRET`.
- Added authoritative Apify run and dataset retrieval.
- Added transaction-level advisory locking.
- Added account outcome and post upserts.
- Added account health updates and fallback recording.
- Added bounded classification leases.
- Added exact replay, interrupted replay, malformed dataset, missing account,
  mixed outcome, fallback, collaborative ownership, metadata refresh,
  concurrent callback, and zero-item tests.
- Passed 19 integration and unit tests, including direct Neon integration.

Production commits:

- `878bc18` - durable provider ingestion and webhook
- `5659a05` - authenticated remote pilot and relative weekday correction

### Gate 4: Remote Webhook Pilot

Status: Complete

- Configured matching webhook secrets locally and in Vercel.
- Started a six-account Apify run with an authenticated ad-hoc webhook.
- Confirmed the deployed route authenticated and fetched the dataset.
- Confirmed all six account outcomes were persisted.
- Confirmed two exact remote replays returned `200` without duplicate work.
- Confirmed the three-day window required no posts fallback.
- Found and repaired an incorrect GPT interpretation of "this Sunday."
- Added deterministic relative-weekday correction and tests.
- Removed the incorrect pilot event and returned its source post to `PENDING`.

Remote pilot:

- Turnout run: `cmryara620000ya50401molfj`
- Apify run: `Lye8lO4Vbo03NLxcv`
- Dataset: `sp8LOGokD0wwuIeDD`

## Gate 5: Reconciliation

Status: Implemented and verified locally; deployment is intentionally dormant

Reconciliation should be implemented as a reusable service first, then exposed
through a manually invoked admin route. It should not be registered in
`vercel.json` during its first deployment.

Implemented files:

```text
src/lib/turnout/reconcile.ts
src/lib/turnout/apify-posts.ts
src/app/api/admin/turnout/reconcile/route.ts
src/lib/turnout/reconcile.integration.test.ts
```

### Manual Endpoint

Route:

```text
POST /api/admin/turnout/reconcile
x-admin-key: ADMIN_SECRET_KEY
```

Proposed response:

```json
{
  "accepted": true,
  "recoveredRuns": 0,
  "fallbacksStarted": 0,
  "fallbacksIngested": 0,
  "leasesReclaimed": 0,
  "postsClaimed": 0,
  "postsProcessed": 0,
  "eventsCreated": 0,
  "runsFinalized": 0,
  "errors": []
}
```

The route should use the same core service that the future cron invokes. The
admin route provides controlled, repeatable draining while the legacy monitor
continues to protect production.

### Reconciliation Order

1. Acquire a reconciliation advisory lock. A concurrent invocation should
   return accepted without starting duplicate provider work.
2. Find `PENDING` or `RETRIEVING` runs with an external run ID whose callback
   may have been missed.
3. Fetch provider state outside a transaction.
4. Pass terminal runs through the existing idempotent ingestion service.
5. Reclaim `PROCESSING` posts whose lease has expired.
6. Identify unresolved `needsFallback` account outcomes.
7. Start one batched `posts` fallback for eligible accounts.
8. Ingest completed fallback datasets using a posts-specific parser.
9. Claim and classify bounded pending-post batches.
10. Finalize runs whose retrieval, fallback, and classification work is
    terminal.
11. Return counters and per-item errors without failing unrelated work.

### Missed Callback Recovery

A run is eligible for recovery when:

- It has a stored `externalRunId`.
- Its status is `PENDING` or `RETRIEVING`.
- It has been unchanged longer than a small grace period, initially five
  minutes.

Provider outcomes:

| Provider state | Reconciliation action |
| --- | --- |
| Running or ready | Leave active and retry later |
| Succeeded | Call the existing ingestion service |
| Failed, aborted, or timed out | Persist a failed run and account health |
| Provider request failed | Record a reconciliation error and retry later |

### Fallback Retrieval

The details parser requires posts fallback when:

- `latestPosts` is missing.
- `latestPosts` is malformed.
- Exactly 12 posts are returned and the oldest unpinned post remains inside
  the retrieval window.
- The previous successful retrieval predates the safe overlap.

Fallback Actor input:

```json
{
  "resultsType": "posts",
  "resultsLimit": 12,
  "onlyPostsNewerThan": "computed retrieval window",
  "skipPinnedPosts": true
}
```

The implemented fallback linkage is:

```text
MonitorRunAccount.fallbackRunId String?
```

`fallbackRunId` references a separate `MonitorRun` whose account outcomes
use `POSTS_FALLBACK`. This preserves one external provider run per
`MonitorRun`, supports batching several fallback accounts, and makes replay and
cost attribution explainable.

The fallback parser has fixture and integration coverage for:

- A normal post result.
- Collaborative ownership.
- A valid account with no posts in the window.
- A missing/private/not-found account.
- A partial multi-account batch.
- Duplicate post metadata refresh.
- Missing account results, which remain failures rather than being mistaken for
  valid empty accounts.

### Classification Draining

Current policy:

- Lease duration: 10 minutes.
- Maximum attempts: 3.
- Webhook batch size: 3.
- Terminal states: `NON_EVENT`, `EVENT_CREATED`, `PERMANENT_ERROR`.

The reconciliation service should:

- Reclaim expired `PROCESSING` leases.
- Claim work using `FOR UPDATE SKIP LOCKED`.
- Prefer eligible posts within active run windows.
- Process small batches repeatedly while inside a strict invocation budget.
- Stop claiming new work before the function deadline.
- Leave unprocessed work durable for the next invocation.
- Mark exhausted retryable work `PERMANENT_ERROR`.

Implemented bounds:

- 48-second service budget within the 60-second Hobby function limit.
- 12-second reserve before starting another classification batch.
- Three posts per lease batch.
- Twelve post claims maximum per invocation.
- Five missed callbacks or completed fallbacks maximum per invocation.
- Thirty-two accounts maximum per batched fallback run.

The deployed project currently uses a 60-second function ceiling. Reconciliation
should reserve time for persistence and return by approximately 50 seconds.

The existing production backlog should be drained with repeated manual admin calls
before cron activation. Daily steady-state volume should be measured during the
32-account test rather than assumed.

### Run Finalization

A run can become `COMPLETED` when:

- Every requested account has a terminal retrieval outcome.
- No account outcome has unresolved fallback work.
- Every eligible post in the run's account/window scope has a terminal
  classification status.
- No active classification lease remains.

A run may remain `PARTIAL` with `completedAt` set when account failures are
terminal and no retryable work remains. A stale run must never remain
`RETRIEVING` or `PROCESSING` indefinitely.

### Reconciliation Acceptance Tests

- Missed successful webhook is recovered.
- Failed provider run updates account health.
- Running provider run is left active.
- Concurrent reconciliation is idempotent.
- Expired classification lease is reclaimed.
- Active classification lease is not stolen.
- Retry attempt three becomes permanent.
- Fallback is started once.
- Fallback webhook replay is safe.
- Posts fallback maps collaborative ownership correctly.
- Partial fallback batch preserves per-account outcomes.
- Repeated admin calls drain all eligible work.
- Run finalization waits for fallback and classification.
- One bad run or post does not prevent other work.
- Invocation budget stops new claims cleanly.

## Remaining Activation Gates

### Gate 6: Drain Pilot Work

Status: Ready after dormant deployment

- Deploy reconciliation without a cron entry.
- Invoke it manually until all pilot-window posts are terminal.
- Resolve both historical fallback outcomes.
- Confirm no expired leases or stale runs remain.
- Review every created event for date and location quality.

### Gate 7: Full 32-Account Manual Batch

Status: Pending

- Start one details batch for all active accounts.
- Verify 32 explainable account outcomes.
- Verify expected Apify cost.
- Verify fallback frequency and cost.
- Drain all eligible classifications.
- Review created events.
- Replay provider callbacks.
- Confirm no duplicate events or posts.

### Gate 8: Cron Replacement

Status: Pending

The Hobby plan permits cron schedules no more frequently than once per day and
does not guarantee precise execution within the selected hour. The final daily
entry must preserve the three-day overlap.

Final switch:

1. Replace the legacy implementation behind `/api/cron/monitor`, or point
   `vercel.json` to a new Turnout trigger route.
2. The daily trigger first runs bounded reconciliation.
3. It starts a new details batch only when no equivalent daily run exists.
4. It returns without waiting for Apify.
5. Remove all cron calls to the legacy direct Instagram monitor.
6. Keep the standalone legacy CLI available temporarily for rollback.

Do not perform this switch until Gates 6 and 7 pass.

## Rollback

If the new daily workflow misbehaves:

1. Restore the legacy cron route in `vercel.json`.
2. Stop starting new Apify runs.
3. Leave webhook ingestion enabled so already-running provider work is not
   lost.
4. Keep durable posts and run history; do not roll back the additive schema.
5. Repair or replay affected runs through reconciliation.

## Environment Variables

Required:

```text
DATABASE_URL
DIRECT_URL
OPENAI_API_KEY
APIFY_API_TOKEN
APIFY_WEBHOOK_SECRET
ADMIN_SECRET_KEY
CRON_SECRET
```

`APIFY_WEBHOOK_SECRET` is generated by us and must match:

- The Vercel environment variable.
- Local `.env.local` for controlled pilot runs.
- The bearer header attached to each ad-hoc Apify webhook.

## Progress Log

### 2026-07-23

- Completed Apify details/posts/reels provider pilot.
- Captured fixtures and locked parser contract.
- Applied the durable provider workflow migration to Neon.
- Verified schema preservation, rollback, cascade behavior, and zero drift.

### 2026-07-24

- Deployed authenticated Apify webhook ingestion.
- Passed replay and transaction integration tests against Neon.
- Completed local six-account production ingestion.
- Configured matching local and Vercel webhook secrets.
- Completed deployed six-account webhook pilot and two exact remote replays.
- Added relative-weekday correction after catching an incorrect "this Sunday"
  date.
- Removed the incorrect event and reset the source post.
- Recorded the production queue baseline in this document.

### 2026-07-28

- Added nullable `MonitorRunAccount.fallbackRunId` with an indexed
  `ON DELETE SET NULL` relation to `MonitorRun`.
- Applied migration `20260728031500_turnout_fallback_run_link` directly to
  Neon and verified the schema is up to date.
- Preserved 32 watched accounts, 2 production runs, 12 account outcomes, 72
  Instagram posts, and 11 events through the migration.
- Added `apify-posts-v1` parsing based on provider `inputUrl`, including
  collaborative ownership, explicit `no_items`, malformed results, and partial
  batch behavior.
- Added batched posts fallback launch, authoritative fallback ingestion,
  original-outcome resolution, and abandoned provider-start recovery.
- Added missed webhook recovery, expired lease recovery, bounded repeated
  classification, retry exhaustion, and run finalization.
- Added protected `POST /api/admin/turnout/reconcile`.
- Passed all 28 Turnout tests against Neon with fake Apify and classifier
  providers.
- Passed TypeScript and the Next.js production build.
- Left `vercel.json` and the legacy daily cron unchanged.
- Stopped before invoking reconciliation against the live backlog, starting a
  full 32-account run, or replacing the cron.

## Log Template

Append an entry after every Turnout production operation:

```text
### YYYY-MM-DD - Short operation name

- Commit:
- Deployment:
- Turnout run:
- Provider run:
- Dataset:
- Accounts requested/retrieved:
- Posts retrieved/processed:
- Events created:
- Fallbacks:
- Replay result:
- Errors:
- Database cleanup:
- Decision / next gate:
```
