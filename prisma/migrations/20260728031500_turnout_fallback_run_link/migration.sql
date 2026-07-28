ALTER TABLE "monitor_run_accounts"
ADD COLUMN "fallbackRunId" TEXT;

CREATE INDEX "monitor_run_accounts_fallbackRunId_idx"
ON "monitor_run_accounts"("fallbackRunId");

ALTER TABLE "monitor_run_accounts"
ADD CONSTRAINT "monitor_run_accounts_fallbackRunId_fkey"
FOREIGN KEY ("fallbackRunId")
REFERENCES "monitor_runs"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
