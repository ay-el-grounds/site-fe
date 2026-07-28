import { z } from "zod";

import {
  ApifyPostSchema,
  normalizeApifyPost,
  type NormalizedAccountOutcome,
} from "./apify-details";

export const APIFY_POSTS_PARSER_VERSION = "apify-posts-v1";

interface RequestedAccount {
  handle: string;
  inputUrl: string;
}

const ApifyPostsErrorSchema = z
  .object({
    inputUrl: z.string().url(),
    error: z.string().min(1),
    errorDescription: z.string().optional(),
  })
  .passthrough();

const ApifyPostsItemSchema = ApifyPostSchema.extend({
  inputUrl: z.string().url(),
});

export function normalizeApifyPostsDataset(
  rawItems: unknown[],
  requestedAccounts: RequestedAccount[]
): Map<string, NormalizedAccountOutcome> {
  const requestedByUrl = new Map(
    requestedAccounts.map((account) => [
      normalizeInstagramUrl(account.inputUrl),
      account,
    ])
  );
  const postsByHandle = new Map<string, NormalizedAccountOutcome>();

  for (const rawItem of rawItems) {
    const inputUrl = extractInputUrl(rawItem);
    const requested = requestedByUrl.get(normalizeInstagramUrl(inputUrl));
    if (!requested) {
      throw new Error(`Posts dataset contains unrequested input URL ${inputUrl}`);
    }

    const handle = normalizeHandle(requested.handle);
    const errorResult = ApifyPostsErrorSchema.safeParse(rawItem);
    if (errorResult.success) {
      postsByHandle.set(handle, normalizeError(errorResult.data, requested));
      continue;
    }

    const postResult = ApifyPostsItemSchema.safeParse(rawItem);
    if (!postResult.success) {
      throw new Error(
        `Invalid Apify posts result for @${requested.handle}: ${postResult.error.message}`
      );
    }

    const outcome =
      postsByHandle.get(handle) ?? {
        ...emptyOutcome(requested),
        status: "RETRIEVED" as const,
      };
    if (outcome.errorCode) {
      throw new Error(
        `Posts dataset mixes an error and posts for @${requested.handle}`
      );
    }
    outcome.posts.push(
      normalizeApifyPost(
        postResult.data,
        requested.handle,
        APIFY_POSTS_PARSER_VERSION
      )
    );
    outcome.status = "RETRIEVED";
    postsByHandle.set(handle, outcome);
  }

  return postsByHandle;
}

function emptyOutcome(account: RequestedAccount): NormalizedAccountOutcome {
  return {
    status: "EMPTY",
    inputUrl: account.inputUrl,
    handle: account.handle,
    providerAccountId: null,
    posts: [],
    fallbackReasons: [],
    errorCode: null,
    errorMessage: null,
    providerSchemaVersion: APIFY_POSTS_PARSER_VERSION,
  };
}

function normalizeError(
  error: z.infer<typeof ApifyPostsErrorSchema>,
  account: RequestedAccount
): NormalizedAccountOutcome {
  if (error.error === "no_items") return emptyOutcome(account);

  return {
    ...emptyOutcome(account),
    status: error.error === "not_found" ? "NOT_FOUND" : "FAILED",
    errorCode: error.error,
    errorMessage: error.errorDescription ?? error.error,
  };
}

function extractInputUrl(raw: unknown): string {
  if (!raw || typeof raw !== "object") {
    throw new Error("Posts dataset item is not an object");
  }
  const inputUrl = (raw as Record<string, unknown>).inputUrl;
  if (typeof inputUrl !== "string" || !inputUrl.trim()) {
    throw new Error("Posts dataset item does not contain inputUrl");
  }
  return inputUrl;
}

function normalizeInstagramUrl(inputUrl: string): string {
  const parsed = new URL(inputUrl);
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = `/${parsed.pathname.split("/").filter(Boolean)[0] ?? ""}/`;
  return parsed.toString().toLowerCase();
}

function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").trim().toLowerCase();
}
