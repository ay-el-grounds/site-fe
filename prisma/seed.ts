/**
 * Seed file for Turnout
 * Inserts all 30 pre-approved Instagram accounts to monitor.
 *
 * Run with: npm run db:seed
 *           or: tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The 30 Instagram accounts Turnout monitors for car meet events.
// Handles are stored WITHOUT the @ prefix.
const WATCHED_ACCOUNTS = [
  { handle: "000magazine",          displayName: "000 Magazine" },
  { handle: "24helps",              displayName: "24 Helps" },
  { handle: "audrainconcours",      displayName: "Audrain Concours" },
  { handle: "bridlemontconcours",   displayName: "Bridlemont Concours" },
  { handle: "caffeineandcarburetors", displayName: "Caffeine & Carburetors" },
  { handle: "carsandcaffe",         displayName: "Cars & Caffè" },
  { handle: "cartdepartment",       displayName: "Cart Department" },
  { handle: "daikokunyc",           displayName: "Daikoku NYC" },
  { handle: "dreamrideexperience",  displayName: "Dream Ride Experience" },
  { handle: "dumbobimmer",          displayName: "Dumbo Bimmer" },
  { handle: "gintaniny",            displayName: "Gintani NY" },
  { handle: "grassroots_edition",   displayName: "Grassroots Edition" },
  { handle: "greenwichconcours",    displayName: "Greenwich Concours" },
  { handle: "lamborghinigreenwich", displayName: "Lamborghini Greenwich" },
  { handle: "larzandersonautomuseum", displayName: "Larz Anderson Auto Museum" },
  { handle: "limerockpark",         displayName: "Lime Rock Park" },
  { handle: "lindustriebk",         displayName: "L'Industrie BK" },
  { handle: "manhattanmotorcars",   displayName: "Manhattan Motorcars" },
  { handle: "metronypca",           displayName: "Metro NY PCA" },
  { handle: "millermotorcars",      displayName: "Miller Motorcars" },
  { handle: "mintyprecision",       displayName: "Minty Precision" },
  { handle: "paulmillerporsche",    displayName: "Paul Miller Porsche" },
  { handle: "porschestimmung",      displayName: "Porsche Stimmung" },
  { handle: "retromobile_us",       displayName: "Retromobile US" },
  { handle: "rpm.autogroup",        displayName: "RPM Auto Group" },
  { handle: "saratogaautomuseum",   displayName: "Saratoga Auto Museum" },
  { handle: "thebridgehamptons",    displayName: "The Bridge Hamptons" },
  { handle: "thelocalpressnyc",     displayName: "The Local Press NYC" },
  { handle: "thestabl3",            displayName: "The Stable" },
  { handle: "watkinsglen",          displayName: "Watkins Glen" },
];

async function main() {
  console.log("🌱 Seeding Turnout watched accounts...");

  let created = 0;
  let skipped = 0;

  for (const account of WATCHED_ACCOUNTS) {
    // upsert — safe to re-run without duplicating data
    const result = await prisma.watchedAccount.upsert({
      where: { handle: account.handle },
      update: {
        // Update displayName if it changes, but don't reset other fields
        displayName: account.displayName,
      },
      create: {
        handle: account.handle,
        displayName: account.displayName,
        isActive: true,
      },
    });

    if (result.createdAt.getTime() === result.createdAt.getTime()) {
      // We can't easily distinguish created vs updated with upsert,
      // so just log the handle
      console.log(`  ✓ @${account.handle}`);
      created++;
    }
  }

  console.log(`\n✅ Done. Processed ${WATCHED_ACCOUNTS.length} accounts.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
