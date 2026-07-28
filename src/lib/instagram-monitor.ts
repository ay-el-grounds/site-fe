/**
 * Instagram Monitor — Core module for Turnout
 *
 * Strategy: Instagram's private API requires auth, but public profile pages
 * embed structured JSON in a <script> tag that we can parse. We fetch the
 * profile page with a realistic browser User-Agent and extract post data.
 *
 * GPT-4o-mini then analyzes each caption and extracts structured event data.
 *
 * Limitations:
 * - Instagram rate-limits aggressive scrapers. We add delays between requests.
 * - If Instagram changes its page structure, the JSON path may need updating.
 * - For production scale, consider a paid Instagram data API (e.g. Apify,
 *   PhantomBuster, or Meta's official Content Publishing API).
 */

import OpenAI from "openai";
import { z } from "zod";
import prisma from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawPost {
  id: string;
  caption: string;
  timestamp: string;       // ISO date string
  mediaUrl: string | null; // First image URL if available
  postUrl: string;         // Full permalink to the Instagram post
  shortcode: string;       // Instagram shortcode (used to build permalink)
}

export interface ExtractedEvent {
  title: string;
  description: string | null;
  date: string;           // ISO date string (required)
  endTime: string | null; // ISO date string or null
  venue: string;
  address: string | null;
  city: string;
  state: string;          // 2-letter code
  categories: Category[];
  ticketUrl: string | null;
}

export type Category =
  | "EXOTIC"
  | "CLASSIC"
  | "AMERICAN"
  | "JDM"
  | "EUROPEAN"
  | "SUPERCAR"
  | "MOTORSPORT"
  | "GENERAL";

export interface MonitorSummary {
  accountsChecked: number;
  eventsFound: number;
  eventsAdded: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Zod schema for GPT response validation
// ---------------------------------------------------------------------------

const CategoryEnum = z.enum([
  "EXOTIC",
  "CLASSIC",
  "AMERICAN",
  "JDM",
  "EUROPEAN",
  "SUPERCAR",
  "MOTORSPORT",
  "GENERAL",
]);

const ExtractedEventSchema = z.object({
  isEvent: z.boolean(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  date: z.string().optional(),       // ISO 8601
  endTime: z.string().nullable().optional(),
  venue: z.string().optional(),
  address: z.string().nullable().optional(),
  city: z.string().optional(),
  state: z.string().optional(),      // 2-letter state code
  categories: z.array(CategoryEnum).optional(),
  ticketUrl: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// OpenAI client (lazy-initialized so missing key doesn't crash import)
// ---------------------------------------------------------------------------

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables.");
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Realistic browser User-Agent to reduce chance of being blocked */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse Instagram post nodes out of the embedded JSON on a profile page.
 * Instagram embeds its initial data in a script tag; we attempt two known
 * data shapes (the structure has changed over time).
 *
 * Returns an empty array if parsing fails — callers handle this gracefully.
 */
function parsePostsFromHtml(html: string, handle: string): RawPost[] {
  try {
    // Strategy 1: Look for window._sharedData JSON blob
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*(\{.+?\});<\/script>/s);
    if (sharedDataMatch) {
      const data = JSON.parse(sharedDataMatch[1]);
      const edges: any[] =
        data?.entry_data?.ProfilePage?.[0]?.graphql?.user
          ?.edge_owner_to_timeline_media?.edges ?? [];
      return edgesToPosts(edges, handle);
    }

    // Strategy 2: Look for the __additionalDataLoaded / inline JSON patterns
    // Instagram now often uses a script tag with type="application/json"
    const jsonScriptMatch = html.match(
      /<script type="application\/json" data-sjs[^>]*>(\{.+?\})<\/script>/s
    );
    if (jsonScriptMatch) {
      const data = JSON.parse(jsonScriptMatch[1]);
      // Walk the nested structure — this path varies; we search heuristically
      const posts = findPostEdges(data);
      return posts.map((node: any) => nodeToPost(node, handle));
    }
  } catch (err) {
    // Parsing errors are expected when Instagram changes its structure
    console.warn(`[instagram-monitor] Could not parse HTML for @${handle}:`, err);
  }

  return [];
}

/** Recursively search for timeline media edges in an unknown JSON structure */
function findPostEdges(obj: any, depth = 0): any[] {
  if (depth > 10 || typeof obj !== "object" || obj === null) return [];

  // Look for the characteristic key pattern
  if (
    Array.isArray(obj?.edges) &&
    obj.edges[0]?.node?.shortcode !== undefined
  ) {
    return obj.edges.map((e: any) => e.node);
  }

  for (const key of Object.keys(obj)) {
    const result = findPostEdges(obj[key], depth + 1);
    if (result.length > 0) return result;
  }

  return [];
}

/** Convert raw GraphQL edge array to RawPost[] */
function edgesToPosts(edges: any[], handle: string): RawPost[] {
  return edges
    .slice(0, 12) // Only process the 12 most recent posts
    .map((edge: any) => nodeToPost(edge.node, handle))
    .filter((p): p is RawPost => p !== null);
}

/** Convert a single GraphQL node to a RawPost */
function nodeToPost(node: any, handle: string): RawPost {
  const caption =
    node?.edge_media_to_caption?.edges?.[0]?.node?.text ??
    node?.caption?.text ??
    node?.accessibility_caption ??
    "";

  const shortcode = node?.shortcode ?? node?.code ?? node?.id ?? "";
  const timestamp =
    node?.taken_at_timestamp
      ? new Date(node.taken_at_timestamp * 1000).toISOString()
      : node?.taken_at
      ? new Date(node.taken_at * 1000).toISOString()
      : new Date().toISOString();

  const mediaUrl =
    node?.display_url ??
    node?.thumbnail_src ??
    node?.image_versions2?.candidates?.[0]?.url ??
    null;

  return {
    id: node?.id ?? shortcode,
    caption,
    timestamp,
    mediaUrl,
    shortcode,
    postUrl: shortcode
      ? `https://www.instagram.com/p/${shortcode}/`
      : `https://www.instagram.com/${handle}/`,
  };
}

// ---------------------------------------------------------------------------
// Core exported functions
// ---------------------------------------------------------------------------

/**
 * Fetch the recent posts for an Instagram account.
 * Returns an array of RawPost objects (up to 12).
 * Throws if the network request fails; caller should catch per-account.
 */
export async function monitorAccount(handle: string): Promise<RawPost[]> {
  // Fetch the public profile page
  const url = `https://www.instagram.com/${handle}/`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      Referer: "https://www.google.com/",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "cross-site",
    },
    // Next.js: don't cache this — always fetch fresh
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} fetching @${handle}: ${response.statusText}`
    );
  }

  const html = await response.text();
  const posts = parsePostsFromHtml(html, handle);

  // If we got no posts from HTML parsing, try the GraphQL endpoint as fallback.
  // Note: Instagram frequently changes this endpoint; treat as best-effort.
  if (posts.length === 0) {
    try {
      const gqlUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`;
      const gqlRes = await fetch(gqlUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          "X-IG-App-ID": "936619743392459", // Public app ID — publicly documented
          Referer: `https://www.instagram.com/${handle}/`,
        },
        cache: "no-store",
      });

      if (gqlRes.ok) {
        const json = await gqlRes.json();
        const edges: any[] =
          json?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
        return edgesToPosts(edges, handle);
      }
    } catch {
      // Fallback also failed — return empty array, monitor will log this
    }
  }

  return posts;
}

/**
 * Use GPT-4o-mini to analyze an Instagram caption and extract event details.
 * Returns an ExtractedEvent if the post describes a car meet/show/event,
 * or null if it does not.
 */
export async function extractEventFromPost(
  post: RawPost,
  handle: string,
  options: { throwOnProviderError?: boolean } = {}
): Promise<ExtractedEvent | null> {
  if (!post.caption || post.caption.trim().length < 20) {
    // Too short to contain meaningful event info
    return null;
  }
  if (!hasSpecificEventDateEvidence(post.caption)) {
    return null;
  }

  const openai = getOpenAI();

  const systemPrompt = `You are an event extraction assistant for Turnout, a car meet calendar for NY/NJ/CT/MA/RI/PA/VT/NH/ME.

Analyze this Instagram post caption and determine if it announces an upcoming car meet, car show, track day, concours, cars & coffee, car rally, or any other automotive event in the Northeastern United States.

If it IS an event announcement, extract the details and respond with a JSON object.
If it is NOT an event (e.g. just a photo post, throwback, for-sale listing, general content), set isEvent to false.

Rules:
- Only extract FUTURE events (relative to the post timestamp provided)
- Only include events in: NY, NJ, CT, MA, RI, PA, VT, NH, ME
- date must be a full ISO 8601 datetime string. If only a date is given with no time, use T10:00:00 as a default start time.
- endTime should be null if not mentioned
- categories must be an array of one or more: EXOTIC, CLASSIC, AMERICAN, JDM, EUROPEAN, SUPERCAR, MOTORSPORT, GENERAL
- If no ticket URL is mentioned, set ticketUrl to null
- If address is not mentioned, set address to null
- state must be the 2-letter abbreviation (e.g. "NY", "CT")
- Resolve relative weekdays such as "this Sunday" from the post timestamp, then verify the ISO date actually falls on that weekday.
- The caption itself must state a specific calendar date or an unambiguous relative date such as "this Sunday" or "tomorrow". Never infer a day from a month, season, event name, account identity, or outside knowledge.
- If venue, city, or state cannot be confidently determined from the caption, return isEvent: false. Do not use "TBD" as a value.
- Do not extract ticket sale announcements, giveaways, sponsorship posts, or recap posts about past events — only extract actual upcoming event occurrences with a specific future date and location.

Respond ONLY with valid JSON matching this schema:
{
  "isEvent": boolean,
  "title": string,
  "description": string | null,
  "date": string,        // ISO 8601
  "endTime": string | null,
  "venue": string,
  "address": string | null,
  "city": string,
  "state": string,       // 2-letter
  "categories": string[],
  "ticketUrl": string | null
}`;

  const userPrompt = `Instagram account: @${handle}
Post timestamp: ${post.timestamp}
Post URL: ${post.postUrl}

Caption:
${post.caption}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1, // Low temperature for consistent structured extraction
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const validated = ExtractedEventSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn(
        `[instagram-monitor] Schema validation failed for post ${post.id}:`,
        validated.error.flatten()
      );
      return null;
    }

    const data = validated.data;

    // Return null if GPT determined this is not an event
    if (!data.isEvent) return null;

    // Ensure required fields are present
    if (!data.title || !data.date || !data.venue || !data.city || !data.state) {
      console.warn(
        `[instagram-monitor] Missing required fields for post ${post.id}`
      );
      return null;
    }

    const resolvedDate = resolveRelativeWeekdayDate(
      data.date,
      post.caption,
      post.timestamp
    );

    return {
      title: data.title,
      description: data.description ?? null,
      date: resolvedDate,
      endTime: data.endTime ?? null,
      venue: data.venue,
      address: data.address ?? null,
      city: data.city,
      state: data.state.toUpperCase(),
      categories: (
        data.categories?.length ? data.categories : ["GENERAL"]
      ) as Category[],
      ticketUrl: data.ticketUrl ?? null,
    };
  } catch (err) {
    console.error(
      `[instagram-monitor] OpenAI extraction failed for post ${post.id}:`,
      err
    );
    if (options.throwOnProviderError) throw err;
    return null;
  }
}

const MONTH_PATTERN =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const WEEKDAY_PATTERN =
  "(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)";

export function hasSpecificEventDateEvidence(caption: string): boolean {
  const patterns = [
    new RegExp(
      `\\b${MONTH_PATTERN}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`,
      "i"
    ),
    new RegExp(
      `\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_PATTERN}\\b`,
      "i"
    ),
    /\b(?:19|20)\d{2}-\d{1,2}-\d{1,2}\b/,
    /\b(?:0?[1-9]|1[0-2])[./-](?:0?[1-9]|[12]\d|3[01])(?:[./-](?:\d{2}|\d{4}))?\b/,
    new RegExp(
      `\\b(?:this|next|coming)\\s+${WEEKDAY_PATTERN}\\b`,
      "i"
    ),
    /\b(?:today|tomorrow|tonight)\b/i,
  ];

  return patterns.some((pattern) => pattern.test(caption));
}

export function resolveRelativeWeekdayDate(
  extractedDate: string,
  caption: string,
  postTimestamp: string
): string {
  const relativeWeekday = caption.match(
    /\b(?:this|next)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i
  );
  if (!relativeWeekday) return extractedDate;

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const targetWeekday = weekdays.indexOf(relativeWeekday[1].toLowerCase());
  const postDate = new Date(postTimestamp);
  if (targetWeekday < 0 || Number.isNaN(postDate.getTime())) {
    return extractedDate;
  }

  const explicitDate = findExplicitWeekdayDate(
    caption,
    targetWeekday,
    postDate
  );
  if (explicitDate) {
    return `${explicitDate}${extractedDate.slice(10)}`;
  }

  const expectedDate = new Date(postDate);
  const daysAhead = (targetWeekday - postDate.getUTCDay() + 7) % 7;
  expectedDate.setUTCDate(expectedDate.getUTCDate() + daysAhead);
  const expectedDay = expectedDate.toISOString().slice(0, 10);
  const extractedDay = extractedDate.slice(0, 10);

  if (extractedDay === expectedDay) return extractedDate;

  console.warn(
    `[instagram-monitor] Corrected relative weekday date from ${extractedDay} to ${expectedDay}`
  );
  return `${expectedDay}${extractedDate.slice(10)}`;
}

export function parseTurnoutDateTime(value: string): Date {
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    return new Date(value);
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/
  );
  if (!match) return new Date(value);

  const [, year, month, day, hour, minute, second = "0", milliseconds = "0"] =
    match;
  const localAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(milliseconds.padEnd(3, "0"))
  );
  let offset = getNewYorkOffsetMs(new Date(localAsUtc));
  let result = localAsUtc - offset;
  const resolvedOffset = getNewYorkOffsetMs(new Date(result));
  if (resolvedOffset !== offset) {
    offset = resolvedOffset;
    result = localAsUtc - offset;
  }
  return new Date(result);
}

function findExplicitWeekdayDate(
  caption: string,
  targetWeekday: number,
  postDate: Date
): string | null {
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const pattern = new RegExp(
    `\\b(${months.join("|")})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`,
    "gi"
  );

  for (const match of caption.matchAll(pattern)) {
    const month = months.indexOf(match[1].toLowerCase());
    const day = Number(match[2]);
    let year = match[3] ? Number(match[3]) : postDate.getUTCFullYear();
    let candidate = new Date(Date.UTC(year, month, day));
    if (
      !match[3] &&
      candidate <
        new Date(
          Date.UTC(
            postDate.getUTCFullYear(),
            postDate.getUTCMonth(),
            postDate.getUTCDate()
          )
        )
    ) {
      year += 1;
      candidate = new Date(Date.UTC(year, month, day));
    }
    if (
      candidate.getUTCMonth() === month &&
      candidate.getUTCDate() === day &&
      candidate.getUTCDay() === targetWeekday
    ) {
      return candidate.toISOString().slice(0, 10);
    }
  }
  return null;
}

const newYorkDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function getNewYorkOffsetMs(date: Date): number {
  const parts = Object.fromEntries(
    newYorkDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return localAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Main monitor runner.
 * Iterates all active WatchedAccounts, fetches recent posts,
 * extracts events with AI, deduplicates, and saves to the database.
 *
 * One failing account will not stop others — errors are collected and returned.
 */
export async function runMonitor(): Promise<MonitorSummary> {
  const summary: MonitorSummary = {
    accountsChecked: 0,
    eventsFound: 0,
    eventsAdded: 0,
    errors: [],
  };

  // Load all active accounts from DB
  const accounts = await prisma.watchedAccount.findMany({
    where: { isActive: true },
    orderBy: { lastCheckedAt: "asc" }, // Check least-recently-checked first
  });

  console.log(
    `[instagram-monitor] Starting monitor run for ${accounts.length} accounts...`
  );

  for (const account of accounts) {
    const logData = {
      accountHandle: account.handle,
      postsChecked: 0,
      eventsFound: 0,
      eventsAdded: 0,
      errors: null as string | null,
    };

    try {
      console.log(`[instagram-monitor] Checking @${account.handle}...`);

      // Fetch recent posts from Instagram
      const posts = await monitorAccount(account.handle);
      logData.postsChecked = posts.length;
      summary.accountsChecked++;

      // Process each post
      for (const post of posts) {
        try {
          // Check for deduplication — skip if this post URL is already in DB
          if (post.postUrl) {
            const existing = await prisma.event.findFirst({
              where: { instagramPostUrl: post.postUrl },
              select: { id: true },
            });
            if (existing) continue; // Already stored
          }

          // Ask GPT to extract event details
          const event = await extractEventFromPost(post, account.handle);

          if (event) {
            logData.eventsFound++;
            summary.eventsFound++;

            const eventDate = parseTurnoutDateTime(event.date);
            if (isNaN(eventDate.getTime())) {
              console.warn(
                `  ⚠ Skipping "${event.title}" due to invalid date: ${event.date}`
              );
              continue;
            }

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (eventDate < sevenDaysAgo) {
              console.log(
                `  ↳ Skipped old event: "${event.title}" on ${event.date}`
              );
              continue;
            }

            const eventDayStart = new Date(eventDate);
            eventDayStart.setHours(0, 0, 0, 0);

            const eventDayEnd = new Date(eventDayStart);
            eventDayEnd.setDate(eventDayEnd.getDate() + 1);

            const duplicateEvent = await prisma.event.findFirst({
              where: {
                title: event.title,
                date: {
                  gte: eventDayStart,
                  lt: eventDayEnd,
                },
                city: event.city,
              },
              select: { id: true },
            });

            if (duplicateEvent) {
              console.log(
                `  ↳ Skipped duplicate event: "${event.title}" on ${eventDayStart.toISOString().slice(0, 10)} in ${event.city}`
              );
              continue;
            }

            // Insert the event into the database
            await prisma.event.create({
              data: {
                title: event.title,
                description: event.description,
                date: eventDate,
                endTime: event.endTime
                  ? parseTurnoutDateTime(event.endTime)
                  : null,
                venue: event.venue,
                address: event.address,
                city: event.city,
                state: event.state,
                categories: event.categories,
                ticketUrl: event.ticketUrl,
                imageUrl: post.mediaUrl,
                instagramPostUrl: post.postUrl,
                sourceAccount: account.handle,
                status: "approved",
                isUserSubmitted: false,
              },
            });

            logData.eventsAdded++;
            summary.eventsAdded++;
            console.log(
              `  ✓ Added: "${event.title}" on ${event.date} in ${event.city}, ${event.state}`
            );
          }

          // Throttle OpenAI calls to avoid rate limits
          await sleep(500);
        } catch (postErr) {
          const msg = postErr instanceof Error ? postErr.message : String(postErr);
          console.warn(`  ⚠ Error on post ${post.id}: ${msg}`);
          // Continue with next post
        }
      }

      // Update lastCheckedAt timestamp
      await prisma.watchedAccount.update({
        where: { id: account.id },
        data: { lastCheckedAt: new Date() },
      });

      // Throttle between accounts to avoid triggering Instagram rate limits
      await sleep(2000);
    } catch (accountErr) {
      const msg =
        accountErr instanceof Error ? accountErr.message : String(accountErr);
      const errorMsg = `@${account.handle}: ${msg}`;
      console.error(`[instagram-monitor] ❌ ${errorMsg}`);
      logData.errors = msg;
      summary.errors.push(errorMsg);
    }

    // Write ScrapeLog entry regardless of success/failure
    try {
      await prisma.scrapeLog.create({ data: logData });
    } catch (logErr) {
      console.error(
        `[instagram-monitor] Failed to write ScrapeLog for @${account.handle}:`,
        logErr
      );
    }
  }

  console.log(
    `[instagram-monitor] Run complete. ` +
      `${summary.accountsChecked} accounts, ` +
      `${summary.eventsFound} events found, ` +
      `${summary.eventsAdded} events added, ` +
      `${summary.errors.length} errors.`
  );

  return summary;
}
