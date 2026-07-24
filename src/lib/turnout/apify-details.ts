import { z } from "zod";

const DAY_MS = 24 * 60 * 60 * 1000;

export const APIFY_DETAILS_PARSER_VERSION = "apify-details-v1";
export const DEFAULT_OVERLAP_DAYS = 3;
export const DEFAULT_RECOVERY_BUFFER_DAYS = 1;
export const DEFAULT_MAX_LOOKBACK_DAYS = 30;

export const FALLBACK_REASONS = [
  "LATEST_POSTS_MISSING",
  "LATEST_POSTS_INVALID",
  "LATEST_POSTS_TRUNCATED",
  "RETRIEVAL_GAP",
] as const;

export type FallbackReason = (typeof FALLBACK_REASONS)[number];

export interface RetrievalWindow {
  start: Date;
  end: Date;
  lookbackDays: number;
  isHistoricalBackfill: boolean;
}

export interface ComputeRetrievalWindowOptions {
  now?: Date;
  lastCompletedRetrievalAt?: Date | null;
  minimumOverlapDays?: number;
  recoveryBufferDays?: number;
  maximumLookbackDays?: number;
}

export interface NormalizedInstagramPost {
  providerPostId: string;
  shortcode: string;
  canonicalUrl: string;
  accountHandle: string;
  ownerHandle: string | null;
  caption: string | null;
  publishedAt: Date;
  mediaUrl: string | null;
  media: {
    type: string | null;
    productType: string | null;
    images: string[];
    videoUrl: string | null;
    childPosts: unknown[];
    isPinned: boolean;
  };
  providerSchemaVersion: string;
}

export type NormalizedAccountStatus =
  | "RETRIEVED"
  | "EMPTY"
  | "FALLBACK_REQUIRED"
  | "NOT_FOUND"
  | "PRIVATE"
  | "FAILED";

export interface NormalizedAccountOutcome {
  status: NormalizedAccountStatus;
  inputUrl: string;
  handle: string;
  providerAccountId: string | null;
  posts: NormalizedInstagramPost[];
  fallbackReasons: FallbackReason[];
  errorCode: string | null;
  errorMessage: string | null;
  providerSchemaVersion: string;
}

export interface NormalizeDetailsOptions {
  retrievalWindowStart: Date;
  now?: Date;
  previousSuccessfulRetrievalAt?: Date | null;
  minimumOverlapDays?: number;
}

const StringIdSchema = z.union([z.string(), z.number()]).transform(String);

const ApifyPostSchema = z
  .object({
    id: StringIdSchema,
    shortCode: z.string().min(1),
    url: z.string().url(),
    caption: z.string().nullable().optional(),
    timestamp: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "timestamp must be a valid date",
    }),
    ownerUsername: z.string().nullable().optional(),
    displayUrl: z.string().url().nullable().optional(),
    images: z.array(z.string()).optional(),
    childPosts: z.array(z.unknown()).optional(),
    type: z.string().nullable().optional(),
    productType: z.string().nullable().optional(),
    videoUrl: z.string().url().nullable().optional(),
    isPinned: z.boolean().nullable().optional(),
  })
  .passthrough();

const ApifyDetailsSuccessSchema = z
  .object({
    inputUrl: z.string().url().optional(),
    username: z.string().min(1),
    id: StringIdSchema,
    private: z.boolean(),
    latestPosts: z.unknown().optional(),
  })
  .passthrough();

const ApifyDetailsErrorSchema = z
  .object({
    inputUrl: z.string().url().optional(),
    username: z.string().min(1).optional(),
    error: z.string().min(1),
    errorDescription: z.string().optional(),
  })
  .passthrough();

export function computeRetrievalWindow(
  options: ComputeRetrievalWindowOptions = {}
): RetrievalWindow {
  const now = options.now ?? new Date();
  const minimumOverlapDays =
    options.minimumOverlapDays ?? DEFAULT_OVERLAP_DAYS;
  const recoveryBufferDays =
    options.recoveryBufferDays ?? DEFAULT_RECOVERY_BUFFER_DAYS;
  const maximumLookbackDays =
    options.maximumLookbackDays ?? DEFAULT_MAX_LOOKBACK_DAYS;

  const isHistoricalBackfill = !options.lastCompletedRetrievalAt;
  const elapsedDays = options.lastCompletedRetrievalAt
    ? Math.max(
        0,
        (now.getTime() - options.lastCompletedRetrievalAt.getTime()) / DAY_MS
      )
    : maximumLookbackDays;

  const desiredLookbackDays = isHistoricalBackfill
    ? maximumLookbackDays
    : Math.max(minimumOverlapDays, elapsedDays + recoveryBufferDays);
  const lookbackDays = Math.min(maximumLookbackDays, desiredLookbackDays);

  return {
    start: new Date(now.getTime() - lookbackDays * DAY_MS),
    end: new Date(now),
    lookbackDays,
    isHistoricalBackfill,
  };
}

export function normalizeApifyDetailsItem(
  raw: unknown,
  options: NormalizeDetailsOptions
): NormalizedAccountOutcome {
  const errorResult = ApifyDetailsErrorSchema.safeParse(raw);
  if (errorResult.success) {
    const handle = resolveHandle(
      errorResult.data.username,
      errorResult.data.inputUrl
    );
    const errorCode = errorResult.data.error;

    return {
      status: errorCode === "not_found" ? "NOT_FOUND" : "FAILED",
      inputUrl:
        errorResult.data.inputUrl ?? instagramProfileUrl(handle),
      handle,
      providerAccountId: null,
      posts: [],
      fallbackReasons: [],
      errorCode,
      errorMessage: errorResult.data.errorDescription ?? errorCode,
      providerSchemaVersion: APIFY_DETAILS_PARSER_VERSION,
    };
  }

  const profileResult = ApifyDetailsSuccessSchema.safeParse(raw);
  if (!profileResult.success) {
    throw new Error(
      `Invalid Apify details result: ${profileResult.error.message}`
    );
  }

  const profile = profileResult.data;
  const inputUrl = profile.inputUrl ?? instagramProfileUrl(profile.username);

  if (profile.private) {
    return {
      status: "PRIVATE",
      inputUrl,
      handle: profile.username,
      providerAccountId: profile.id,
      posts: [],
      fallbackReasons: [],
      errorCode: "private_profile",
      errorMessage: "Profile is private",
      providerSchemaVersion: APIFY_DETAILS_PARSER_VERSION,
    };
  }

  const fallbackReasons: FallbackReason[] = [];
  const posts: NormalizedInstagramPost[] = [];

  if (profile.latestPosts === undefined) {
    fallbackReasons.push("LATEST_POSTS_MISSING");
  } else if (!Array.isArray(profile.latestPosts)) {
    fallbackReasons.push("LATEST_POSTS_INVALID");
  } else {
    for (const rawPost of profile.latestPosts) {
      const parsedPost = ApifyPostSchema.safeParse(rawPost);
      if (!parsedPost.success) {
        addFallbackReason(fallbackReasons, "LATEST_POSTS_INVALID");
        continue;
      }

      posts.push(normalizePost(parsedPost.data, profile.username));
    }

    if (
      profile.latestPosts.length === 12 &&
      isLikelyTruncated(posts, options.retrievalWindowStart)
    ) {
      addFallbackReason(fallbackReasons, "LATEST_POSTS_TRUNCATED");
    }
  }

  const now = options.now ?? new Date();
  const safeOverlapStart = new Date(
    now.getTime() -
      (options.minimumOverlapDays ?? DEFAULT_OVERLAP_DAYS) * DAY_MS
  );
  if (
    options.previousSuccessfulRetrievalAt &&
    options.previousSuccessfulRetrievalAt < safeOverlapStart
  ) {
    addFallbackReason(fallbackReasons, "RETRIEVAL_GAP");
  }

  return {
    status:
      fallbackReasons.length > 0
        ? "FALLBACK_REQUIRED"
        : posts.length > 0
          ? "RETRIEVED"
          : "EMPTY",
    inputUrl,
    handle: profile.username,
    providerAccountId: profile.id,
    posts,
    fallbackReasons,
    errorCode: null,
    errorMessage: null,
    providerSchemaVersion: APIFY_DETAILS_PARSER_VERSION,
  };
}

function normalizePost(
  post: z.infer<typeof ApifyPostSchema>,
  accountHandle: string
): NormalizedInstagramPost {
  return {
    providerPostId: post.id,
    shortcode: post.shortCode,
    canonicalUrl: post.url,
    accountHandle,
    ownerHandle: post.ownerUsername ?? null,
    caption: post.caption ?? null,
    publishedAt: new Date(post.timestamp),
    mediaUrl: post.displayUrl ?? post.images?.[0] ?? null,
    media: {
      type: post.type ?? null,
      productType: post.productType ?? null,
      images: post.images ?? [],
      videoUrl: post.videoUrl ?? null,
      childPosts: post.childPosts ?? [],
      isPinned: post.isPinned ?? false,
    },
    providerSchemaVersion: APIFY_DETAILS_PARSER_VERSION,
  };
}

function isLikelyTruncated(
  posts: NormalizedInstagramPost[],
  retrievalWindowStart: Date
): boolean {
  const unpinnedPosts = posts.filter((post) => !post.media.isPinned);
  if (unpinnedPosts.length === 0) return true;

  const oldestUnpinnedPost = Math.min(
    ...unpinnedPosts.map((post) => post.publishedAt.getTime())
  );
  return oldestUnpinnedPost > retrievalWindowStart.getTime();
}

function resolveHandle(username?: string, inputUrl?: string): string {
  if (username) return username;
  if (inputUrl) {
    const pathname = new URL(inputUrl).pathname;
    const handle = pathname.split("/").filter(Boolean)[0];
    if (handle) return handle;
  }
  throw new Error("Apify result does not identify an Instagram account");
}

function instagramProfileUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

function addFallbackReason(
  reasons: FallbackReason[],
  reason: FallbackReason
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}
