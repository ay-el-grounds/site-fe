/**
 * Standalone monitor runner for Turnout
 *
 * Usage:
 *   npm run monitor
 *   npx tsx scripts/run-monitor.ts
 *
 * This script is designed to be run:
 *   1. Manually during development/testing
 *   2. Via a cron job on a server or CI/CD system
 *   3. As a Vercel Cron Job (via POST /api/admin/monitor instead)
 *
 * Environment variables required (set in .env.local or system env):
 *   DATABASE_URL      — Neon pooled connection string
 *   DIRECT_URL        — Neon direct connection string (for Prisma migrations)
 *   OPENAI_API_KEY    — OpenAI API key for event extraction
 *
 * Note: This script uses tsx to run TypeScript directly without compilation.
 * Path aliases (@/lib/*) are resolved via tsconfig.json paths.
 */

// Load environment variables from .env.local if present
// (In production Vercel injects them automatically)
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" }); // Fallback to .env

import { runMonitor } from "../src/lib/instagram-monitor";

async function main() {
  console.log("====================================");
  console.log("  Turnout Instagram Monitor");
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log("====================================\n");

  try {
    const summary = await runMonitor();

    console.log("\n====================================");
    console.log("  Run Summary");
    console.log("====================================");
    console.log(`  Accounts checked : ${summary.accountsChecked}`);
    console.log(`  Events found     : ${summary.eventsFound}`);
    console.log(`  Events added     : ${summary.eventsAdded}`);
    console.log(`  Errors           : ${summary.errors.length}`);

    if (summary.errors.length > 0) {
      console.log("\n  Errors:");
      summary.errors.forEach((err) => console.log(`  - ${err}`));
    }

    console.log(`\n  Finished: ${new Date().toISOString()}`);
    console.log("====================================\n");

    // Exit with non-zero code if there were errors (useful for CI alerting)
    if (summary.errors.length > 0 && summary.eventsAdded === 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Fatal error during monitor run:");
    console.error(err);
    process.exit(1);
  }
}

main();
